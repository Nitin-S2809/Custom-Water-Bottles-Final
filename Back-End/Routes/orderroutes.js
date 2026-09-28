const express = require("express");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

const upload = require("../Middleware/uploadMiddleware");

const {
  calculateOrderPrice,
  createOrder,
  getUserOrders,
  getOrder,
  getCustomerDeliveryOtpStatus,
} = require("../Controller/orderController");
const {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
} = require("../Controller/paymentController");

router.post("/calculate-price", calculateOrderPrice);
router.post("/payment/create-order", upload.single("logo"), createPaymentOrder);
router.post("/payment/verify", verifyPayment);
router.post("/payment/webhook", handleRazorpayWebhook);
router.post("/", upload.single("logo"), createOrder);
router.get("/user/:userId", authMiddleware, getUserOrders);
router.get("/:orderId/delivery-otp-status", authMiddleware, getCustomerDeliveryOtpStatus);
router.get("/:orderId", authMiddleware, getOrder);

module.exports = router;