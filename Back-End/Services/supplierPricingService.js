const { SUPPLIER_UNIT_COST_PAISE } = require("../config/supplierPricingConfig");

const calculateSupplierPricing = ({ bottleType, quantity, items }) => {
  const sourceItems = Array.isArray(items) && items.length
    ? items
    : [{ bottleType, quantity }];

  const pricedItems = sourceItems.map((item) => {
    const unitCostPaise = SUPPLIER_UNIT_COST_PAISE[item.bottleType];
    const itemQuantity = Number(item.quantity);

    if (!Number.isSafeInteger(unitCostPaise) || !Number.isSafeInteger(itemQuantity) || itemQuantity <= 0) {
      throw new Error("Unable to calculate supplier bottle cost for this order");
    }

    const subtotalPaise = unitCostPaise * itemQuantity;
    if (!Number.isSafeInteger(subtotalPaise)) {
      throw new Error("Supplier bottle cost exceeds the supported monetary range");
    }

    return {
      bottleType: item.bottleType,
      quantity: itemQuantity,
      unitCostPaise,
      subtotalPaise,
    };
  });

  const subtotalPaise = pricedItems.reduce((total, item) => total + item.subtotalPaise, 0);
  if (!Number.isSafeInteger(subtotalPaise)) {
    throw new Error("Supplier bottle cost exceeds the supported monetary range");
  }

  return {
    items: pricedItems,
    subtotalPaise,
    currency: "INR",
  };
};

module.exports = {
  calculateSupplierPricing,
};
