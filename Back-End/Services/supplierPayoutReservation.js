const reserveSupplierPayout = ({ Order, orderId, supplierId, amountPaise, initiatedAt }) => (
  Order.findOneAndUpdate(
    {
      _id: orderId,
      supplierId,
      supplierPayoutStatus: { $in: ["pending", "not_eligible"] },
      status: "delivered",
      deliveryOtpVerifiedAt: { $ne: null },
      paymentStatus: { $in: ["paid", "captured"] },
      supplierPayoutId: null,
    },
    {
      $set: {
        supplierPayoutStatus: "initiating",
        supplierPayoutAmount: amountPaise / 100,
        supplierPayoutAmountPaise: amountPaise,
        supplierPayoutInitiatedAt: initiatedAt,
      },
    },
    { new: true, runValidators: true }
  )
);

module.exports = {
  reserveSupplierPayout,
};
