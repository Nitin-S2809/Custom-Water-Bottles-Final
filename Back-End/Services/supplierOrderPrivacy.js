const toSupplierSafeOrder = (order) => {
  if (!order) return order;

  const value = typeof order.toObject === "function" ? order.toObject() : order;
  const safeOrder = {};
  const allowedFields = [
    "_id",
    "supplierId",
    "bottleType",
    "quantity",
    "brandName",
    "printing",
    "logoUrl",
    "specialInstructions",
    "status",
    "deliveryStatus",
    "paymentStatus",
    "deliveryOtpVerifiedAt",
    "supplierPayoutStatus",
    "supplierPayoutId",
    "supplierPayoutAmount",
    "supplierPayoutAmountPaise",
    "supplierPayoutInitiatedAt",
    "supplierPayoutCompletedAt",
    "supplierPayoutFailedAt",
    "supplierPayoutFailureReason",
    "expectedDelivery",
    "createdAt",
    "updatedAt",
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      safeOrder[field] = value[field];
    }
  }

  if (Array.isArray(value.items)) {
    safeOrder.items = value.items.map((item) => ({
      ...(typeof item?.bottleType === "string" ? { bottleType: item.bottleType } : {}),
      ...(Number.isFinite(item?.quantity) ? { quantity: item.quantity } : {}),
    }));
  }

  if (value.supplierPricing && typeof value.supplierPricing === "object") {
    const supplierPricing = value.supplierPricing.toObject
      ? value.supplierPricing.toObject()
      : value.supplierPricing;
    safeOrder.supplierPricing = {
      ...(Array.isArray(supplierPricing.items)
        ? {
          items: supplierPricing.items.map((item) => ({
            ...(typeof item?.bottleType === "string" ? { bottleType: item.bottleType } : {}),
            ...(Number.isFinite(item?.quantity) ? { quantity: item.quantity } : {}),
            ...(Number.isSafeInteger(item?.unitCostPaise) ? { unitCostPaise: item.unitCostPaise } : {}),
            ...(Number.isSafeInteger(item?.subtotalPaise) ? { subtotalPaise: item.subtotalPaise } : {}),
          })),
        }
        : {}),
      ...(Number.isSafeInteger(supplierPricing.subtotalPaise)
        ? { subtotalPaise: supplierPricing.subtotalPaise }
        : {}),
      ...(supplierPricing.currency === "INR" ? { currency: supplierPricing.currency } : {}),
    };
  }

  const username = value.customer?.username;
  safeOrder.customer = typeof username === "string" ? { username } : null;

  return safeOrder;
};

module.exports = {
  toSupplierSafeOrder,
};
