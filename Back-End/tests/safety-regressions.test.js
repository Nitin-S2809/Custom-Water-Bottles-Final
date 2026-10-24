const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const test = require("node:test");

const pricingConfig = require("../config/pricingConfig");
const { calculatePrice, calculateCartPrice } = require("../Services/pricingService");
const { calculateSupplierPricing } = require("../Services/supplierPricingService");
const { toSupplierSafeOrder } = require("../Services/supplierOrderPrivacy");
const passwordResetEmail = require("../Services/passwordResetEmail");
const {
  parseRazorpayWebhookPayload,
  verifyRazorpayWebhookSignature,
} = require("../Services/razorpayWebhook");
const {
  DELIVERY_OTP_ELIGIBLE_STATUSES,
  DELIVERY_OTP_GENERATION_STATUSES,
  isDeliveryOtpOrderEligible,
  buildDeliveryOtpVerificationFilter,
  buildDeliveryOtpCancellationUpdate,
} = require("../Services/deliveryOtpPolicy");
const { reserveSupplierPayout } = require("../Services/supplierPayoutReservation");
const { buildHappyClientsPipeline } = require("../Services/happyClientsQuery");
const Order = require("../MODELS/orderModel");
const Supplier = require("../MODELS/supplier");
const User = require("../MODELS/usermodel");
const orderService = require("../Services/orderService");
const supplierRoutes = require("../Routes/SupplierRoutes");
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
  assert.deepEqual(DELIVERY_OTP_GENERATION_STATUSES, ["out-for-delivery"]);
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

test("supplier serializer allowlists customer name and supplier-side order information", () => {
  const supplierOrder = toSupplierSafeOrder({
    _id: "order-id",
    bottleType: "500ml",
    quantity: 600,
    items: [{ bottleType: "500ml", quantity: 600, unitPrice: 9, subtotal: 5400 }],
    pricing: { unitPrice: 9, subtotal: 5400, shipping: 600, total: 6000 },
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
    customer: {
      username: "Allowed",
      phoneNumber: "private",
      email: "private",
      address: { addressLine1: "private", city: "private" },
      nested: { phoneNumber: "private" },
    },
    supplierPricing: {
      subtotalPaise: 474000,
      currency: "INR",
      items: [{ bottleType: "500ml", quantity: 600, unitCostPaise: 790, subtotalPaise: 474000, unitPrice: 9 }],
    },
    deliveryOtpHash: "private",
    deliveryOtpExpiresAt: new Date(),
    userId: "private",
    razorpayOrderId: "private",
    status: "accepted",
  });
  for (const key of ["address", "addressId", "addressSnapshot", "deliveryAddress", "addressLine1", "fullName", "pincode", "city", "state", "phoneNumber", "email"]) {
    assert.equal(Object.hasOwn(supplierOrder, key), false);
  }
  assert.deepEqual(supplierOrder.customer, { username: "Allowed" });
  assert.equal(Object.hasOwn(supplierOrder, "pricing"), false);
  assert.equal(Object.hasOwn(supplierOrder, "deliveryOtpHash"), false);
  assert.equal(Object.hasOwn(supplierOrder, "deliveryOtpExpiresAt"), false);
  assert.equal(Object.hasOwn(supplierOrder, "userId"), false);
  assert.equal(Object.hasOwn(supplierOrder, "razorpayOrderId"), false);
  assert.deepEqual(supplierOrder.items, [{ bottleType: "500ml", quantity: 600 }]);
  assert.equal(supplierOrder.supplierPricing.subtotalPaise, 474000);
  assert.deepEqual(supplierOrder.supplierPricing.items, [{
    bottleType: "500ml",
    quantity: 600,
    unitCostPaise: 790,
    subtotalPaise: 474000,
  }]);
});

test("delivery OTP generation stores a hashed code without changing order or payment status", async () => {
  const originals = {
    findOne: Order.findOne,
    updateOne: Order.updateOne,
    findById: User.findById,
    sendDeliveryOtp: passwordResetEmail.sendDeliveryOtp,
  };
  const testOrder = {
    _id: "order-id",
    supplierId: "supplier-id",
    userId: "customer-id",
    status: "out-for-delivery",
    deliveryStatus: "out-for-delivery",
    paymentStatus: "captured",
    deliveryOtpHash: "expired-hash",
    deliveryOtpExpiresAt: new Date(0),
    deliveryOtpGeneratedAt: new Date(0),
  };
  let storedUpdate;
  let sentEmail;

  Order.findOne = () => ({
    select() {
      return { lean: async () => testOrder };
    },
  });
  Order.updateOne = async (filter, update) => {
    assert.equal(filter.supplierId, "supplier-id");
    assert.ok(filter.$and[0].$or.some((condition) => condition.deliveryOtpExpiresAt?.$lte));
    storedUpdate = update;
    return { matchedCount: 1 };
  };
  User.findById = () => ({
    select() {
      return { lean: async () => ({ username: "Customer", email: "customer@example.com" }) };
    },
  });
  passwordResetEmail.sendDeliveryOtp = async (email) => {
    sentEmail = email;
  };

  try {
    const result = await orderService.generateDeliveryOtp({ orderId: "order-id", supplierId: "supplier-id" });
    const otp = sentEmail.otp;
    assert.match(otp, /^\d{6}$/);
    assert.equal(storedUpdate.$set.deliveryOtpHash, crypto.createHash("sha256").update(otp).digest("hex"));
    assert.ok(storedUpdate.$set.deliveryOtpExpiresAt > new Date());
    assert.equal(Object.hasOwn(storedUpdate.$set, "status"), false);
    assert.equal(Object.hasOwn(storedUpdate.$set, "paymentStatus"), false);
    assert.equal(Object.hasOwn(storedUpdate.$set, "deliveryStatus"), false);
    assert.equal(testOrder.status, "out-for-delivery");
    assert.equal(testOrder.paymentStatus, "captured");
    assert.ok(result.expiresAt > new Date());
  } finally {
    Order.findOne = originals.findOne;
    Order.updateOne = originals.updateOne;
    User.findById = originals.findById;
    passwordResetEmail.sendDeliveryOtp = originals.sendDeliveryOtp;
  }
});

test("delivery OTP generation rejects unassigned suppliers and does not replace an active OTP", async (t) => {
  const originalFindOne = Order.findOne;
  const originalUpdateOne = Order.updateOne;
  let updateCalled = false;

  t.after(() => {
    Order.findOne = originalFindOne;
    Order.updateOne = originalUpdateOne;
  });

  Order.findOne = (filter) => ({
    select() {
      return {
        lean: async () => filter.supplierId === "supplier-a"
          ? {
            supplierId: "supplier-a",
            status: "out-for-delivery",
            deliveryStatus: "out-for-delivery",
            paymentStatus: "paid",
            deliveryOtpHash: "existing-hash",
            deliveryOtpExpiresAt: new Date(Date.now() + 60_000),
          }
          : null,
      };
    },
  });
  Order.updateOne = async () => {
    updateCalled = true;
    return { matchedCount: 1 };
  };

  await assert.rejects(
    orderService.generateDeliveryOtp({ orderId: "order-id", supplierId: "supplier-b" }),
    (error) => error.code === "ORDER_NOT_FOUND"
  );
  await assert.rejects(
    orderService.generateDeliveryOtp({ orderId: "order-id", supplierId: "supplier-a" }),
    (error) => error.code === "OTP_ALREADY_ACTIVE"
  );
  assert.equal(updateCalled, false);
});

test("supplier OTP endpoint is authenticated POST at the mounted API path", async () => {
  const originals = {
    jwtSecret: process.env.JWT_SECRET,
    supplierFindById: Supplier.findById,
    generateDeliveryOtp: orderService.generateDeliveryOtp,
  };
  let supplierApproved = true;
  let generatedFor;
  process.env.JWT_SECRET = "supplier-route-test-secret";
  Supplier.findById = () => ({
    select() {
      return {
        lean: async () => ({
          role: "supplier",
          isActive: supplierApproved,
          approvalStatus: supplierApproved ? "approved" : "pending",
        }),
      };
    },
  });
  orderService.generateDeliveryOtp = async (params) => {
    generatedFor = params;
    return { expiresAt: new Date(Date.now() + 600_000) };
  };

  const app = express();
  app.use(express.json());
  app.use("/api/suppliers", supplierRoutes);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/suppliers/orders/order-id/generate-delivery-otp`;
  const token = jwt.sign({ id: "supplier-id", role: "supplier" }, process.env.JWT_SECRET);

  try {
    const getResponse = await fetch(baseUrl);
    assert.equal(getResponse.status, 404);

    const unauthenticatedResponse = await fetch(baseUrl, { method: "POST" });
    assert.equal(unauthenticatedResponse.status, 401);

    supplierApproved = false;
    const pendingSupplierResponse = await fetch(baseUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(pendingSupplierResponse.status, 403);

    supplierApproved = true;
    const authorizedResponse = await fetch(baseUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(authorizedResponse.status, 200);
    assert.deepEqual(generatedFor, { orderId: "order-id", supplierId: "supplier-id" });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    Supplier.findById = originals.supplierFindById;
    orderService.generateDeliveryOtp = originals.generateDeliveryOtp;
    if (originals.jwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originals.jwtSecret;
    }
  }
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
