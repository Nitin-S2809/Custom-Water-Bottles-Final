/**
 * Centralized Pricing Configuration
 * Single source of truth for all bottle prices
 */

const BOTTLE_PRICES = {
  "250ml": 5,
  "500ml": 7,
  "1000ml": 9,
  "2000ml": 15,
};

const SHIPPING_RULES = {
  // 1 to 500 bottles
  tier1: {
    minQuantity: 1,
    maxQuantity: 500,
    cost: 400,
  },
  // More than 500 bottles (no upper limit)
  tier2: {
    minQuantity: 501,
    cost: 600,
  },
};

/**
 * Get bottle price by type
 * @param {string} bottleType - e.g., "250ml", "500ml", "1000ml", "2000ml"
 * @returns {number|null} Price in INR or null if invalid type
 */
const getBottlePrice = (bottleType) => {
  return BOTTLE_PRICES[bottleType] || null;
};

/**
 * Get all available bottle types
 * @returns {array} Array of bottle type strings
 */
const getAvailableBottleTypes = () => {
  return Object.keys(BOTTLE_PRICES);
};

/**
 * Calculate shipping cost based on quantity
 * @param {number} quantity - Number of bottles
 * @returns {number} Shipping cost in INR
 */
const calculateShipping = (quantity) => {
  if (quantity <= 500) {
    return SHIPPING_RULES.tier1.cost;
  } else {
    return SHIPPING_RULES.tier2.cost;
  }
};

/**
 * Validate bottle type
 * @param {string} bottleType - Bottle type to validate
 * @returns {boolean} True if valid, false otherwise
 */
const isValidBottleType = (bottleType) => {
  return BOTTLE_PRICES.hasOwnProperty(bottleType);
};

module.exports = {
  BOTTLE_PRICES,
  SHIPPING_RULES,
  getBottlePrice,
  getAvailableBottleTypes,
  calculateShipping,
  isValidBottleType,
};
