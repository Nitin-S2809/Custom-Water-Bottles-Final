const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const test = require("node:test");

const pricingConfig = require("../config/pricingConfig");
const { calculatePrice, calculateCartPrice } = require("../Services/pricingService");
const { calculateSupplierPricing } = require("../Services/supplierPricingService");
const { toSupplierSafeOrder } = require("../Services/supplierOrderPrivacy");
const {
  parseRazorpayWebhookPayload,
  verifyRazorpayWebhookSignature,
} = require("../Services/razorpayWebhook");
const {
  DELIVERY_OTP_ELIGIBLE_STATUSES,
  isDeliveryOtpOrderEligible,
  buildDeliveryOtpVerificationFilter,
  buildDeliveryOtpCancellationUpdate,
} = require("../Services/deliveryOtpPolicy");
const { reserveSupplierPayout } = require("../Services/supplierPayoutReservation");
const { buildHappyClientsPipeline } = require("../Services/happyClientsQuery");
const Order = require("../MODELS/orderModel");
const orderService = require("../Services/orderService");
const { handleRazorpayWebhook } = require("../Controller/paymentController");

const webhookSecret = "unit-test-webhook-secret";
const signWebhook = (rawBody) => crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("webhook signatures use the exact raw body and reject malformed signatures", () => {
  const rawBody = Buffer.from('{ "event" : "payment.captured", "payload": {} }\n');
  const signature = signWebhook(rawBody);

  assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret), true);
  assert.equal(verifyRazorpayWebhookSignature(Buffer.from(rawBody.toString().trim()), signature, webhookSecret), false);
  assert.equal(verifyRazorpayWebhookSignature(rawBody, "bad", webhookSecret), false);
  assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, ""), false);
  assert.throws(() => parseRazorpayWebhookPayload(Buffer.from("{")), SyntaxError);
  assert.throws(() => parseRazorpayWebhookPayload(Buffer.alloc(0)), TypeError);
});

test("webhook raw-body parsing precedes JSON parsing without changing normal JSON routes", async () => {
  const app = express();
  app.use("/api/orders/payment/webhook", express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json());
  app.post("/api/orders/payment/webhook", (req, res) => {
    res.json({ isRaw: Buffer.isBuffer(req.body), body: req.body.toString("utf8") });
  });
  app.post("/ordinary-json", (req, res) => res.json({ isObject: !Buffer.isBuffer(req.body), value: req.body.value }));
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const rawText = '{ "event" : "payment.captured" }\n';
    const webhookResponse = await fetch(`${baseUrl}/api/orders/payment/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawText,
    });
    const webhookBody = await webhookResponse.json();
    assert.equal(webhookBody.isRaw, true);
    assert.equal(webhookBody.body, rawText);

    const ordinaryResponse = await fetch(`${baseUrl}/ordinary-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "still-parsed" }),
    });
    const ordinaryBody = await ordinaryResponse.json();
    assert.deepEqual(ordinaryBody, { isObject: true, value: "still-parsed" });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("webhook controller rejects invalid signatures and dispatches captured and failed events", async () => {
  const previousSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const originals = {
    getOrderByRazorpayId: orderService.getOrderByRazorpayId,
    markPaymentAsPaid: orderService.markPaymentAsPaid,
    markPaymentAsFailed: orderService.markPaymentAsFailed,
  };
  const dispatched = [];
  process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
  orderService.getOrderByRazorpayId = async (id) => ({ _id: id });
  orderService.markPaymentAsPaid = async (...args) => dispatched.push(["captured", ...args]);
  orderService.markPaymentAsFailed = async (...args) => dispatched.push(["failed", ...args]);

  try {
    const invalidBody = Buffer.from('{"event":"payment.captured"}');
    const invalidResponse = makeResponse();
    await handleRazorpayWebhook({
      body: invalidBody,
      headers: { "x-razorpay-signature": "invalid" },
    }, invalidResponse);
    assert.equal(invalidResponse.statusCode, 400);
    assert.equal(dispatched.length, 0);

    for (const event of [
      {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } },
      },
      {
        event: "order.paid",
        payload: { order: { entity: { id: "order_1" } } },
      },
      {
        event: "payment.failed",
        payload: { payment: { entity: { id: "pay_2", order_id: "order_2" } } },
      },
    ]) {
      const rawBody = Buffer.from(JSON.stringify(event));
      const response = makeResponse();
      await handleRazorpayWebhook({
        body: rawBody,
        headers: { "x-razorpay-signature": signWebhook(rawBody) },
      }, response);
      assert.equal(response.statusCode, 200);
    }

    assert.equal(dispatched[0][0], "captured");
    assert.equal(dispatched[0][1], "order_1");
    assert.equal(dispatched[1][0], "captured");
    assert.equal(dispatched[1][1], "order_1");
    assert.equal(dispatched[2][0], "failed");
    assert.equal(dispatched[2][1], "order_2");
  } finally {
    orderService.getOrderByRazorpayId = originals.getOrderByRazorpayId;
    orderService.markPaymentAsPaid = originals.markPaymentAsPaid;
    orderService.markPaymentAsFailed = originals.markPaymentAsFailed;
    if (previousSecret === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = previousSecret;
  }
});

test("payment state updates are idempotent and a failure cannot overwrite a captured payment", async () => {
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const originalFindById = Order.findById;
  const orderId = "payment-test-order";
  let state = { _id: orderId, paymentStatus: "pending" };
  let stateTransitions = 0;

  Order.findOneAndUpdate = async (filter, update) => {
    if (String(filter._id) !== orderId || filter.paymentStatus.$nin.includes(state.paymentStatus)) return null;
    const nextStatus = update.$set.paymentStatus;
    if (nextStatus !== state.paymentStatus) stateTransitions += 1;
    state = { ...state, ...update.$set };
    return { ...state };
  };
  Order.findById = async () => ({ ...state });

  try {
    await orderService.markPaymentAsPaid(orderId, { paymentStatus: "captured" });
    await orderService.markPaymentAsPaid(orderId, { paymentStatus: "captured" });
    await orderService.markPaymentAsFailed(orderId);

    assert.equal(state.paymentStatus, "captured");
    assert.equal(stateTransitions, 1);
  } finally {
    Order.findOneAndUpdate = originalFindOneAndUpdate;
    Order.findById = originalFindById;
  }
});

test("failed-payment webhook state is idempotent", async () => {
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  let state = { _id: "failed-payment-order", paymentStatus: "pending" };
  let stateTransitions = 0;

  Order.findOneAndUpdate = async (filter, update) => {
    if (filter.paymentStatus.$nin.includes(state.paymentStatus)) return null;
    if (state.paymentStatus !== update.$set.paymentStatus) stateTransitions += 1;
    state = { ...state, ...update.$set };
    return { ...state };
  };

  try {
    await orderService.markPaymentAsFailed(state._id);
    await orderService.markPaymentAsFailed(state._id);
    assert.equal(state.paymentStatus, "failed");
    assert.equal(stateTransitions, 1);
  } finally {
    Order.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("supplier payout reservation allows only one concurrent reservation", async () => {
  let payoutStatus = "pending";
  let reservations = 0;
  const fakeOrderModel = {
    async findOneAndUpdate(filter, update) {
      if (!filter.supplierPayoutStatus.$in.includes(payoutStatus)) return null;
      if (filter.status !== "delivered" || !filter.paymentStatus.$in.includes("captured")) return null;
      if (filter.supplierPayoutId !== null) return null;
      if (payoutStatus !== "pending") return null;
      payoutStatus = update.$set.supplierPayoutStatus;
      reservations += 1;
      return { ...update.$set };
    },
  };

  const reservationParams = {
    Order: fakeOrderModel,
    orderId: "payout-order",
    supplierId: "supplier",
    amountPaise: 474000,
    initiatedAt: new Date(),
  };
  const results = await Promise.all([
    reserveSupplierPayout(reservationParams),
    reserveSupplierPayout(reservationParams),
  ]);

  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(reservations, 1);
  assert.equal(payoutStatus, "initiating");
  assert.notEqual(payoutStatus, "processed");
});

test("delivery OTP policy excludes cancelled, unpaid, completed, and other-supplier orders", async () => {
  const baseOrder = {
    supplierId: "supplier-a",
    status: "out-for-delivery",
    paymentStatus: "captured",
    deliveryStatus: "out-for-delivery",
  };
  assert.equal(isDeliveryOtpOrderEligible(baseOrder, "supplier-a"), true);
  assert.equal(isDeliveryOtpOrderEligible({ ...baseOrder, status: "cancelled" }, "supplier-a"), false);
  assert.equal(isDeliveryOtpOrderEligible({ ...baseOrder, paymentStatus: "pending" }, "supplier-a"), false);
  assert.equal(isDeliveryOtpOrderEligible(baseOrder, "supplier-b"), false);
  assert.equal(isDeliveryOtpOrderEligible({ ...baseOrder, deliveryStatus: "completed" }, "supplier-a"), false);

  const filter = buildDeliveryOtpVerificationFilter({
    orderId: "delivery-order",
    supplierId: "supplier-a",
    otpHash: "one-time-hash",
    verifiedAt: new Date(),
  });
  assert.deepEqual(filter.status.$in, DELIVERY_OTP_ELIGIBLE_STATUSES);
  assert.deepEqual(filter.paymentStatus.$in, ["paid", "captured"]);
  assert.equal(filter.deliveryOtpHash, "one-time-hash");
});

test("delivery OTP consumption is atomic and does not mutate payment state", async () => {
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const verifiedAt = new Date();
  const filter = buildDeliveryOtpVerificationFilter({
    orderId: "delivery-order",
    supplierId: "supplier-a",
    otpHash: "one-time-hash",
    verifiedAt,
  });
  let state = {
    status: "out-for-delivery",
    deliveryStatus: "out-for-delivery",
    deliveryOtpHash: "one-time-hash",
    deliveryOtpExpiresAt: new Date(verifiedAt.getTime() + 60_000),
    paymentStatus: "captured",
  };

  Order.findOneAndUpdate = async (query, update) => {
    if (!query.status.$in.includes(state.status)
      || !query.paymentStatus.$in.includes(state.paymentStatus)
      || query.deliveryOtpHash !== state.deliveryOtpHash
      || state.deliveryOtpExpiresAt <= query.deliveryOtpExpiresAt.$gt
      || state.deliveryStatus === "completed") return null;
    state = { ...state, ...update.$set };
    return { ...state };
  };

  try {
    const results = await Promise.all([
      Order.findOneAndUpdate(filter, { $set: { status: "delivered", deliveryStatus: "completed", deliveryOtpHash: null } }),
      Order.findOneAndUpdate(filter, { $set: { status: "delivered", deliveryStatus: "completed", deliveryOtpHash: null } }),
    ]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(state.status, "delivered");
    assert.equal(state.deliveryOtpHash, null);
    assert.equal(state.paymentStatus, "captured");
  } finally {
    Order.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("cancellation update invalidates all active delivery OTP fields", () => {
  const unset = buildDeliveryOtpCancellationUpdate().$unset;
  assert.deepEqual(Object.keys(unset).sort(), [
    "deliveryOtpAttempts",
    "deliveryOtpExpiresAt",
    "deliveryOtpGeneratedAt",
    "deliveryOtpHash",
  ]);
});

test("admin status service rejects delivered status without consulting the database", async () => {
  await assert.rejects(
    orderService.updateAdminOrderStatus("order-id", "delivered"),
    (error) => error.code === "DELIVERY_OTP_REQUIRED"
  );
});

test("supplier bottle cost and customer pricing regressions", () => {
  const supplierCases = [
    ["250ml", 570, 342000],
    ["500ml", 790, 474000],
    ["1000ml", 1150, 690000],
  ];
  for (const [bottleType, unitCostPaise, subtotalPaise] of supplierCases) {
    const pricing = calculateSupplierPricing({ bottleType, quantity: 600 });
    assert.equal(pricing.items[0].unitCostPaise, unitCostPaise);
    assert.equal(pricing.subtotalPaise, subtotalPaise);
  }

  for (const [bottleType, unitPrice, total] of [
    ["250ml", 7, 4800],
    ["500ml", 9, 6000],
    ["1000ml", 16, 10200],
  ]) {
    const result = calculatePrice({ bottleType, quantity: 600 });
    assert.equal(result.success, true);
    assert.equal(result.pricing.unitPrice, unitPrice);
    assert.equal(result.pricing.shipping, 600);
    assert.equal(result.pricing.total, total);
    assert.equal(result.pricing.total * 100, total * 100);
  }

  assert.equal(pricingConfig.calculateShipping(500), 400);
  assert.equal(pricingConfig.calculateShipping(501), 600);
  assert.equal(calculateCartPrice([
    { bottleType: "250ml", quantity: 300 },
    { bottleType: "500ml", quantity: 300 },
  ]).success, false);
});

test("supplier serializer removes customer address and private contact fields", () => {
  const supplierOrder = toSupplierSafeOrder({
    address: "private",
    addressId: "private",
    addressSnapshot: "private",
    deliveryAddress: { addressLine1: "private", pincode: "private" },
    addressLine1: "private",
    fullName: "private",
    pincode: "private",
    city: "private",
    state: "private",
    phoneNumber: "private",
    email: "private",
    customer: { username: "Allowed", phoneNumber: "Allowed", address: "private", email: "private" },
    supplierPricing: { subtotalPaise: 474000 },
    status: "accepted",
  });
  for (const key of ["address", "addressId", "addressSnapshot", "deliveryAddress", "addressLine1", "fullName", "pincode", "city", "state", "phoneNumber", "email"]) {
    assert.equal(Object.hasOwn(supplierOrder, key), false);
  }
  assert.deepEqual(supplierOrder.customer, { username: "Allowed", phoneNumber: "Allowed" });
  assert.equal(supplierOrder.supplierPricing.subtotalPaise, 474000);
});

test("public happy-clients aggregate requires verified paid delivery and groups by customer", () => {
  const [match, group, count] = buildHappyClientsPipeline();
  assert.equal(match.$match.status, "delivered");
  assert.equal(match.$match.deliveryStatus, "completed");
  assert.deepEqual(match.$match.paymentStatus.$in, ["paid", "captured"]);
  assert.deepEqual(match.$match.deliveryOtpVerifiedAt, { $type: "date" });
  assert.equal(group.$group._id, "$userId");
  assert.equal(count.$count, "happyClients");
  assert.equal(Object.keys(match.$match).some((key) => /name|phone|address|order/i.test(key)), false);
});
