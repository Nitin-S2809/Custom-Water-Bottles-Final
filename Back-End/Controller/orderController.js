const orderService = require("../Services/orderService");
const { calculatePrice } = require("../Services/pricingService");

const calculateOrderPrice = async (req, res) => {
  try {
    const { bottleType, quantity } = req.body;

    if (!bottleType || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Bottle type and quantity are required",
      });
    }

    const result = calculatePrice({
      bottleType,
      quantity: Number(quantity),
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Price calculation error:", error);

    return res.status(500).json({
      success: false,
      message: "Error calculating price",
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      bottleType,
      quantity,
      specialInstructions,
      brandName,
      printing,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const { isValidBottleType } = require("../config/pricingConfig");
    if (!isValidBottleType(bottleType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bottle type. Must be one of: 250ml, 500ml, 1000ml, 2000ml",
      });
    }

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const pricingResult = calculatePrice({
      bottleType,
      quantity: Number(quantity),
    });

    if (!pricingResult.success) {
      return res.status(400).json({
        success: false,
        message: pricingResult.message,
      });
    }

    const { pricing } = pricingResult;

    const orderData = {
      userId,
      bottleType,
      quantity: Number(quantity),
      brandName: brandName || "",
      printing: printing || "Single Color Logo",
      logoUrl: req.file ? `/uploads/${req.file.filename}` : "",
      specialInstructions: specialInstructions || "",
      pricing: {
        unitPrice: pricing.unitPrice,
        subtotal: pricing.subtotal,
        shipping: pricing.shipping,
        total: pricing.total,
      },
    };

    const order = await orderService.createOrder(orderData);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user && req.user.id && req.params.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only access your own orders" });
    }

    const orders = await orderService.getOrdersByUser(userId);

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getCustomerOrderById({ orderId, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

const getCustomerDeliveryOtpStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerStatus = await orderService.getDeliveryOtpStatusForCustomer({
      orderId,
      userId: req.user.id,
    });

    return res.status(200).json({ success: true, ...customerStatus });
  } catch (error) {
    if (error.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Unable to load delivery OTP status" });
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const { search, status, paymentStatus, startDate, endDate, page, limit, sortBy, sortOrder } = req.query || {};
    const result = await orderService.getAdminOrdersList({
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};

const getAdminOrderStats = async (req, res) => {
  try {
    const { search, status, paymentStatus, startDate, endDate } = req.query || {};
    const summary = await orderService.getAdminOrderStats({ search, status, paymentStatus, startDate, endDate });
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("Admin order stats error:", error);
    return res.status(500).json({ success: false, message: "Unable to load order summary" });
  }
};

const getAdminOrderById = async (req, res) => {
  try {
    const order = await orderService.getAdminOrderById(req.params.id);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    if (error.code === "INVALID_ORDER_ID") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error("Admin order details error:", error);
    return res.status(500).json({ success: false, message: "Unable to load order details" });
  }
};

const updateAdminOrderStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    const order = await orderService.updateAdminOrderStatus(req.params.id, status);
    return res.status(200).json({ success: true, message: "Order status updated successfully", order });
  } catch (error) {
    if (error.code === "INVALID_ORDER_STATUS") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error("Admin order status update error:", error);
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

const exportAdminOrdersCsv = async (req, res) => {
  try {
    const { search, status, paymentStatus, startDate, endDate } = req.query || {};
    const csv = await orderService.buildAdminOrdersCsv({ search, status, paymentStatus, startDate, endDate });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="aquabrand-orders-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Admin order export error:", error);
    return res.status(500).json({ success: false, message: "Unable to export orders" });
  }
};

module.exports = {
  calculateOrderPrice,
  createOrder,
  getUserOrders,
  getOrder,
  getCustomerDeliveryOtpStatus,
  getAdminOrders,
  getAdminOrderStats,
  getAdminOrderById,
  updateAdminOrderStatus,
  exportAdminOrdersCsv,
};