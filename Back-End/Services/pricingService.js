/**
 * Pricing Service
 * Handles all pricing calculations for orders
 */

const {
  getBottlePrice,
  calculateShipping,
  isValidBottleType,
  getAvailableBottleTypes,
} = require("../config/pricingConfig");

/**
 * Validate pricing request input
 * @param {object} params - {bottleType, quantity}
 * @returns {object} {valid: boolean, error?: string}
 */
const validatePricingInput = (params) => {
  const { bottleType, quantity } = params;

  // Validate bottleType is provided
  if (!bottleType || typeof bottleType !== "string") {
    return {
      valid: false,
      error: "Bottle type is required and must be a string",
    };
  }

  // Validate bottleType is supported
  if (!isValidBottleType(bottleType)) {
    return {
      valid: false,
      error: `Invalid bottle type. Supported types: ${getAvailableBottleTypes().join(
        ", "
      )}`,
    };
  }

  // Validate quantity is provided
  if (quantity === undefined || quantity === null) {
    return {
      valid: false,
      error: "Quantity is required",
    };
  }

  // Convert quantity to number if it's a string
  const numQuantity = Number(quantity);

  // Validate quantity is a valid number
  if (isNaN(numQuantity)) {
    return {
      valid: false,
      error: "Quantity must be a valid number",
    };
  }

  // Validate quantity is an integer
  if (!Number.isInteger(numQuantity)) {
    return {
      valid: false,
      error: "Quantity must be an integer",
    };
  }

  // Validate quantity is positive
  if (numQuantity <= 0) {
    return {
      valid: false,
      error: "Quantity must be a positive number",
    };
  }

  return { valid: true };
};

/**
 * Calculate pricing for an order
 * @param {object} params - {bottleType, quantity}
 * @returns {object} Pricing object or error
 * @example
 * calculatePrice({ bottleType: "500ml", quantity: 250 })
 * // Returns: {
 * //   success: true,
 * //   pricing: {
 * //     bottleType: "500ml",
 * //     quantity: 250,
 * //     unitPrice: 7,
 * //     subtotal: 1750,
 * //     shipping: 400,
 * //     total: 2150
 * //   }
 * // }
 */
const calculatePrice = (params) => {
  try {
    // Validate input
    const validation = validatePricingInput(params);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error,
      };
    }

    const { bottleType, quantity } = params;
    const numQuantity = Number(quantity);

    // Get unit price
    const unitPrice = getBottlePrice(bottleType);
    if (unitPrice === null) {
      return {
        success: false,
        message: `Price not found for bottle type: ${bottleType}`,
      };
    }

    // Calculate subtotal
    const subtotal = unitPrice * numQuantity;

    // Calculate shipping
    let shipping;
    try {
      shipping = calculateShipping(numQuantity);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    // Calculate total
    const total = subtotal + shipping;

    return {
      success: true,
      pricing: {
        bottleType,
        quantity: numQuantity,
        unitPrice,
        subtotal,
        shipping,
        total,
      },
    };
  } catch (error) {
    console.error("Pricing calculation error:", error);
    return {
      success: false,
      message: "Error calculating price",
    };
  }
};

const calculateCartPrice = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, message: "At least one cart item is required" };
  }

  const pricedItems = [];
  let totalQuantity = 0;
  let subtotal = 0;

  for (const item of items) {
    const result = calculatePrice({
      bottleType: item.bottleType,
      quantity: Number(item.quantity),
    });

    if (!result.success) return result;

    const { pricing } = result;
    pricedItems.push({
      ...item,
      bottleType: pricing.bottleType,
      quantity: pricing.quantity,
      unitPrice: pricing.unitPrice,
      subtotal: pricing.subtotal,
    });
    totalQuantity += pricing.quantity;
    subtotal += pricing.subtotal;
  }

  const shipping = calculateShipping(totalQuantity);
  return {
    success: true,
    pricing: {
      items: pricedItems,
      quantity: totalQuantity,
      subtotal,
      shipping,
      total: subtotal + shipping,
    },
  };
};

module.exports = {
  validatePricingInput,
  calculatePrice,
  calculateCartPrice,
};
