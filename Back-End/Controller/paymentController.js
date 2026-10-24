const crypto = require("crypto");
const Razorpay = require("razorpay");
const orderService = require("../Services/orderService");
const {
  parseRazorpayWebhookPayload,
  verifyRazorpayWebhookSignature,
} = require("../Services/razorpayWebhook");
const { calculatePrice, calculateCartPrice } = require("../Services/pricingService");
const { isValidBottleType } = require("../config/pricingConfig");

let razorpay;

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay test keys are not configured");
  }

  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpay;
};

const redactDiagnosticText = (value) => {
  let text;
  try {
    text = typeof value === "string" ? value : String(value);
  } catch {
    return "[unavailable]";
  }

  const secretEnvironmentVariables = [
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "JWT_SECRET",
    "RESEND_API_KEY",
  ];

  for (const name of secretEnvironmentVariables) {
    const secret = process.env[name];
    if (secret) text = text.split(secret).join("[REDACTED]");
  }

  return text
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\brzp_(?:test|live)_[A-Za-z0-9]+\b/gi, "[REDACTED_RAZORPAY_KEY]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[REDACTED_PHONE]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]");
};

const readDiagnosticProperty = (value, property) => {
  try {
    return value == null ? undefined : value[property];
  } catch {
    return undefined;
  }
};

const safeErrorDetail = (value) => {
  if (value == null) return null;
  if (typeof value !== "object") return redactDiagnosticText(value);

  const detail = {};
  for (const property of ["code", "description", "source", "step", "reason"]) {
    const field = readDiagnosticProperty(value, property);
    if (typeof field === "string" || typeof field === "number" || typeof field === "boolean") {
      detail[property] = redactDiagnosticText(field);
    }
  }
  return Object.keys(detail).length > 0 ? detail : "[object]";
};

const createPaymentOrder = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("Create payment order error: Razorpay server credentials are not configured");
    return res.status(503).json({
      success: false,
      message: "Payments are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend deployment environment.",
    });
  }

  let localOrder;

  try {
    const razorpayClient = getRazorpayClient();
    const rawItems = req.body?.items;
    const parsedItems = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
    const itemList = Array.isArray(parsedItems) ? parsedItems : [];

    const {
      userId,
      bottleType,
      quantity,
      specialInstructions,
      brandName,
      printing,
      paymentMethod,
      logoUrl,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!req.user || !req.user.id || req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only create a payment for your own order.",
      });
    }

    let orderPayload;
    let expectedTotal;

    if (itemList.length > 0) {
      const cartResult = calculateCartPrice(itemList);
      if (!cartResult.success) {
        return res.status(400).json({ success: false, message: cartResult.message });
      }

      const { items: validatedItems, quantity: totalQuantity, subtotal, shipping, total } = cartResult.pricing;
      expectedTotal = total;

      orderPayload = {
        userId,
        bottleType: validatedItems.length > 1 ? "Mixed Bottles" : validatedItems[0].bottleType,
        quantity: totalQuantity,
        logoUrl: req.file ? `/uploads/${req.file.filename}` : logoUrl || "",
        brandName: brandName || "",
        printing: printing || "Single Color Logo",
        specialInstructions: specialInstructions || "",
        items: validatedItems,
        pricing: {
          unitPrice: totalQuantity ? subtotal / totalQuantity : 0,
          subtotal,
          shipping,
          total: expectedTotal,
        },
        paymentMethod: paymentMethod || "",
        paymentStatus: "pending",
        paymentOrderStatus: "creating",
        currency: "INR",
      };
    } else {
      if (!userId || !bottleType || !quantity) {
        return res.status(400).json({
          success: false,
          message: "User ID, bottle type and quantity are required",
        });
      }

      if (!isValidBottleType(bottleType)) {
        return res.status(400).json({ success: false, message: "Invalid bottle type" });
      }

      const pricingResult = calculatePrice({ bottleType, quantity: Number(quantity) });
      if (!pricingResult.success) {
        return res.status(400).json({ success: false, message: pricingResult.message });
      }

      expectedTotal = Number(pricingResult.pricing.total);
      const { pricing } = pricingResult;
      orderPayload = {
        userId,
        bottleType,
        quantity: Number(quantity),
        logoUrl: req.file ? `/uploads/${req.file.filename}` : logoUrl || "",
        brandName: brandName || "",
        printing: printing || "Single Color Logo",
        specialInstructions: specialInstructions || "",
        pricing: {
          unitPrice: pricing.unitPrice,
          subtotal: pricing.subtotal,
          shipping: pricing.shipping,
          total: pricing.total,
        },
        paymentMethod: paymentMethod || "",
        paymentStatus: "pending",
        paymentOrderStatus: "creating",
        currency: "INR",
      };
    }

    const amountPaise = Math.round(expectedTotal * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({
        success: false,
        message: "The payment amount must be at least 100 paise.",
      });
    }

    localOrder = await orderService.createOrder(orderPayload);
    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `order_${localOrder._id}`,
      notes: { localOrderId: String(localOrder._id), userId: String(userId) },
    });

    const updatedOrder = await orderService.updateOrder(localOrder._id, {
      razorpayOrderId: razorpayOrder.id,
      paymentOrderStatus: "ready",
    });

    return res.status(201).json({
      success: true,
      order: orderService.toCustomerSafeOrder(updatedOrder),
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    if (localOrder) {
      try {
        await orderService.updateOrder(localOrder._id, {
          paymentOrderStatus: "unconfirmed",
        });
      } catch (stateError) {
        console.error(
          "Unable to flag unconfirmed Razorpay order creation",
          stateError.code || stateError.name || "UnknownError"
        );
      }
    }

    const responseStatus = readDiagnosticProperty(
      readDiagnosticProperty(error, "response"),
      "status"
    );
    const rawStatus = readDiagnosticProperty(error, "statusCode") || responseStatus;
    const parsedStatus =
      typeof rawStatus === "number" || typeof rawStatus === "string"
        ? Number(rawStatus)
        : NaN;
    const gatewayStatus =
      Number.isInteger(parsedStatus) && parsedStatus >= 400 && parsedStatus <= 599
        ? parsedStatus
        : null;
    const rawMessage = readDiagnosticProperty(error, "message");
    const rawDescription = readDiagnosticProperty(error, "description");
    const rawCode = readDiagnosticProperty(error, "code");
    const rawStack = readDiagnosticProperty(error, "stack");

    const diagnostic = {
      message: rawMessage == null ? null : redactDiagnosticText(rawMessage),
      statusCode: gatewayStatus,
      error: safeErrorDetail(readDiagnosticProperty(error, "error")),
      description: rawDescription == null ? null : redactDiagnosticText(rawDescription),
      code: rawCode == null ? null : redactDiagnosticText(rawCode),
      stack: typeof rawStack === "string" ? redactDiagnosticText(rawStack) : null,
    };
    console.error("Create payment order error:", JSON.stringify(diagnostic));

    const statusCode = gatewayStatus
      ? gatewayStatus >= 500 ? 502 : gatewayStatus
      : 500;
    const message = gatewayStatus === 401
      ? "Payment provider authentication failed. Please try again later."
      : gatewayStatus && gatewayStatus < 500
        ? "Payment provider rejected the order request. Please check the order details and try again."
        : "Unable to start payment. Please try again.";

    return res.status(statusCode).json({
      success: false,
      message,
      ...(localOrder
        ? {
            orderId: String(localOrder._id),
            paymentOrderStatus: "unconfirmed",
          }
        : {}),
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Razorpay test keys are not configured",
      });
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (
      typeof razorpayOrderId !== "string" ||
      !razorpayOrderId ||
      typeof razorpayPaymentId !== "string" ||
      !razorpayPaymentId ||
      typeof razorpaySignature !== "string" ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const order = await orderService.getOrderByRazorpayId(razorpayOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Payment order not found" });
    }

    if (!req.user || !req.user.id || String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only verify your own payment.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const signaturesMatch =
      expectedSignature.length === razorpaySignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
      );

    if (!signaturesMatch) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const paidOrder = await orderService.markPaymentAsPaid(order._id, {
      razorpayPaymentId,
      razorpaySignature,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: orderService.toCustomerSafeOrder(paidOrder),
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

const handleRazorpayWebhook = async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: "Razorpay webhook secret is not configured" });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!verifyRazorpayWebhookSignature(req.body, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
    return res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature" });
  }

  let payload;
  try {
    payload = parseRazorpayWebhookPayload(req.body);
  } catch {
    return res.status(400).json({ success: false, message: "Malformed Razorpay webhook payload" });
  }

  try {
    const event = payload.event;
    if (typeof event !== "string" || !event) {
      return res.status(400).json({ success: false, message: "Malformed Razorpay webhook payload" });
    }
    const paymentEntity = payload && payload.payload && payload.payload.payment ? payload.payload.payment : null;
    const orderEntity = payload && payload.payload && payload.payload.order ? payload.payload.order : null;

    if (event === "payment.captured" || event === "payment.failed") {
      const payment = paymentEntity && paymentEntity.entity;
      if (!payment || typeof payment.id !== "string" || typeof payment.order_id !== "string") {
        return res.status(400).json({ success: false, message: "Malformed Razorpay payment event" });
      }
    }

    if (event === "order.paid" && typeof orderEntity?.entity?.id !== "string") {
      return res.status(400).json({ success: false, message: "Malformed Razorpay order event" });
    }

    if (event === "payment.captured" || event === "order.paid") {
      const payment = paymentEntity?.entity;
      const razorpayOrderId = event === "order.paid"
        ? orderEntity.entity.id
        : payment.order_id;
      const order = await orderService.getOrderByRazorpayId(razorpayOrderId);
      if (order) {
        await orderService.markPaymentAsPaid(order._id, {
          paymentStatus: "captured",
          ...(payment?.id ? { razorpayPaymentId: payment.id } : {}),
          paidAt: order.paidAt || new Date(),
        });
      }
    }

    if (event === "payment.failed") {
      const payment = paymentEntity.entity;
      const order = await orderService.getOrderByRazorpayId(payment.order_id);
      if (order) {
        await orderService.markPaymentAsFailed(order._id);
      }
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

module.exports = { createPaymentOrder, verifyPayment, handleRazorpayWebhook };
