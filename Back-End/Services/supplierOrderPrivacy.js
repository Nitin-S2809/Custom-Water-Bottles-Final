const toSupplierSafeOrder = (order) => {
  if (!order) return order;

  const safeOrder = typeof order.toObject === "function" ? order.toObject() : { ...order };
  for (const field of [
    "address",
    "addressId",
    "addressSnapshot",
    "addressLine1",
    "addressLine2",
    "customer",
    "customerAddress",
    "customerEmail",
    "customerPhone",
    "deliveryInstructions",
    "deliveryAddress",
    "fullName",
    "pincode",
    "postalCode",
    "zipCode",
    "city",
    "state",
    "country",
    "email",
    "phoneNumber",
    "shippingAddress",
    "user",
  ]) {
    delete safeOrder[field];
  }

  if (order.customer && typeof order.customer === "object") {
    safeOrder.customer = {
      ...(typeof order.customer.username === "string" ? { username: order.customer.username } : {}),
      ...(typeof order.customer.phoneNumber === "string" ? { phoneNumber: order.customer.phoneNumber } : {}),
    };
  }

  return safeOrder;
};

module.exports = {
  toSupplierSafeOrder,
};
