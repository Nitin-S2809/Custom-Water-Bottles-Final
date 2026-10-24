const DELIVERY_OTP_ELIGIBLE_STATUSES = Object.freeze([
  "in-production",
  "ready",
  "shipped",
  "out-for-delivery",
]);
const DELIVERY_OTP_GENERATION_STATUSES = Object.freeze(["out-for-delivery"]);

const isDeliveryOtpOrderEligible = (order, supplierId) => Boolean(
  order
  && String(order.supplierId || "") === String(supplierId || "")
  && DELIVERY_OTP_ELIGIBLE_STATUSES.includes(order.status)
  && ["paid", "captured"].includes(order.paymentStatus)
  && order.deliveryStatus !== "completed"
);

const buildDeliveryOtpVerificationFilter = ({ orderId, supplierId, otpHash, verifiedAt }) => ({
  _id: orderId,
  supplierId,
  status: { $in: DELIVERY_OTP_ELIGIBLE_STATUSES },
  deliveryStatus: { $ne: "completed" },
  paymentStatus: { $in: ["paid", "captured"] },
  deliveryOtpHash: otpHash,
  deliveryOtpExpiresAt: { $gt: verifiedAt },
});

const buildFailedDeliveryOtpAttemptFilter = ({ orderId, supplierId, otpHash, maxAttempts }) => ({
  _id: orderId,
  supplierId,
  status: { $in: DELIVERY_OTP_ELIGIBLE_STATUSES },
  deliveryOtpHash: otpHash,
  $or: [
    { deliveryOtpAttempts: { $lt: maxAttempts } },
    { deliveryOtpAttempts: { $exists: false } },
  ],
});

const buildDeliveryOtpCancellationUpdate = () => ({
  $unset: {
    deliveryOtpHash: 1,
    deliveryOtpExpiresAt: 1,
    deliveryOtpAttempts: 1,
    deliveryOtpGeneratedAt: 1,
  },
});

module.exports = {
  DELIVERY_OTP_ELIGIBLE_STATUSES,
  DELIVERY_OTP_GENERATION_STATUSES,
  isDeliveryOtpOrderEligible,
  buildDeliveryOtpVerificationFilter,
  buildFailedDeliveryOtpAttemptFilter,
  buildDeliveryOtpCancellationUpdate,
};
