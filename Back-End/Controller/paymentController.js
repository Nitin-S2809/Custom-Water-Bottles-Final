const crypto = require("crypto");
const Razorpay = require("razorpay");
const orderService = require("../Services/orderService");
const { calculatePrice } = require("../Services/pricingService");
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

const createPaymentOrder = async (req, res) => {
  try {
    const razorpayClient = getRazorpayClient();
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

    const { pricing } = pricingResult;
    const safeLogoUrl = req.file ? `/uploads/${req.file.filename}` : (logoUrl || "");
    const localOrder = await orderService.createOrder({
      userId,
      bottleType,
      quantity: Number(quantity),
      logoUrl: safeLogoUrl,
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
      currency: "INR",
    });

    const razorpayOrder = await razorpayClient.orders.create({
      amount: Math.round(pricing.total * 100),
      currency: "INR",
      receipt: `order_${localOrder._id}`,
      notes: { localOrderId: String(localOrder._id) },
    });

    const updatedOrder = await orderService.updateOrder(localOrder._id, {
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      order: updatedOrder,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to start payment. Please try again.",
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

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const order = await orderService.getOrderByRazorpayId(razorpayOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Payment order not found" });
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
      await orderService.updateOrder(order._id, { paymentStatus: "failed" });
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const paidOrder = await orderService.updateOrder(order._id, {
      paymentStatus: "paid",
      status: "pending",
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: paidOrder,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const payload = req.body;

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).json({ success: false, message: "Razorpay webhook secret is not configured" });
    }

    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");

    if (!signature || !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
      return res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature" });
    }

    const event = payload && payload.event ? payload.event : "unknown";
    const paymentEntity = payload && payload.payload && payload.payload.payment ? payload.payload.payment : null;
    const orderEntity = payload && payload.payload && payload.payload.order ? payload.payload.order : null;

    if ((event === "payment.captured" || event === "order.paid") && paymentEntity) {
      const order = await orderService.getOrderByRazorpayId(orderEntity ? orderEntity.id : paymentEntity.order_id);
      if (order) {
        await orderService.updateOrder(order._id, { paymentStatus: "captured", status: "pending" });
      }
    }

    if (event === "payment.failed" && paymentEntity) {
      const order = await orderService.getOrderByRazorpayId(paymentEntity.order_id);
      if (order) {
        await orderService.updateOrder(order._id, { paymentStatus: "failed" });
      }
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

module.exports = { createPaymentOrder, verifyPayment, handleRazorpayWebhook };
