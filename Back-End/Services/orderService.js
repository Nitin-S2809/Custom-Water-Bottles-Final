const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../MODELS/orderModel");
const Supplier = require("../MODELS/supplier");
const User = require("../MODELS/usermodel");
const Address = require("../MODELS/addressModel");
const Razorpay = require("razorpay");

const DELIVERY_OTP_TTL_MINUTES = Number(process.env.DELIVERY_OTP_TTL_MINUTES || 10);
const DELIVERY_OTP_MAX_ATTEMPTS = Number(process.env.DELIVERY_OTP_MAX_ATTEMPTS || 3);
const DELIVERY_OTP_RESEND_COOLDOWN_SECONDS = Math.max(0, Number(process.env.DELIVERY_OTP_RESEND_COOLDOWN_SECONDS || 60));
const passwordResetEmail = require("./passwordResetEmail");

const toHash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

const secureCompare = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};

const createOrder = async (orderData) => {
  const order = await Order.create(orderData);

  return order;
};

const getOrdersByUser = async (userId) => {
  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 });

  return orders;
};

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);

  return order;
};

const getCustomerOrderById = async ({ orderId, userId }) => {
  if (!mongoose.isValidObjectId(orderId)) return null;

  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) return null;

  const [customer, deliveryAddress, supplier] = await Promise.all([
    User.findById(order.userId).select("username email").lean(),
    Address.findOne({ userId: order.userId }).select("fullName phoneNumber email addressLine1 addressLine2 city state pincode country deliveryInstructions").lean(),
    order.supplierId
      ? Supplier.findById(order.supplierId).select("companyName ownerName businessEmail phoneNumber city state").lean()
      : null,
  ]);

  const {
    razorpayPaymentId,
    razorpaySignature,
    deliveryOtpHash,
    deliveryOtpExpiresAt,
    deliveryOtpAttempts,
    ...safeOrder
  } = order;

  return {
    ...safeOrder,
    customer: customer || null,
    deliveryAddress: deliveryAddress || null,
    supplier: supplier || null,
  };
};

const getOrderByRazorpayId = async (razorpayOrderId) => {
  return Order.findOne({ razorpayOrderId });
};

const updateOrder = async (orderId, updates) => {
  return Order.findByIdAndUpdate(orderId, updates, { new: true, runValidators: true });
};

const generateDeliveryOtp = async ({ orderId, supplierId }) => {
  const order = await Order.findOne({ _id: orderId, supplierId }).lean();

  if (!order) {
    const error = new Error("Order not found for this supplier");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  if (["cancelled", "delivered"].includes(order.status)) {
    const error = new Error("Delivery OTP cannot be generated for this order state");
    error.code = "ORDER_NOT_ELIGIBLE";
    throw error;
  }

  if (!order.paymentStatus || !["paid", "captured"].includes(order.paymentStatus)) {
    const error = new Error("Payment not captured");
    error.code = "PAYMENT_NOT_CAPTURED";
    throw error;
  }

  if (!order.supplierId) {
    const error = new Error("Supplier not assigned to this order");
    error.code = "SUPPLIER_NOT_ASSIGNED";
    throw error;
  }

  const allowedStatuses = ["ready", "shipped", "out-for-delivery", "in-production"];
  if (!allowedStatuses.includes(order.status)) {
    const error = new Error("Order is not ready for delivery OTP generation");
    error.code = "ORDER_NOT_READY";
    throw error;
  }

  const customer = await User.findById(order.userId).select("username email").lean();
  const customerEmail = typeof customer?.email === "string" ? customer.email.trim() : "";
  if (!customer || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    const error = new Error("Customer email address is not available for this order.");
    error.code = "CUSTOMER_EMAIL_UNAVAILABLE";
    throw error;
  }

  const now = new Date();
  const cooldownMs = DELIVERY_OTP_RESEND_COOLDOWN_SECONDS * 1000;
  const cooldownCutoff = new Date(now.getTime() - cooldownMs);
  if (order.deliveryOtpGeneratedAt && new Date(order.deliveryOtpGeneratedAt) > cooldownCutoff) {
    const error = new Error("A delivery OTP was recently sent. Please wait before requesting another.");
    error.code = "OTP_RESEND_COOLDOWN";
    throw error;
  }

  const otp = String(crypto.randomInt(100000, 1000000)).padStart(6, "0");
  const otpHash = toHash(otp);
  const expiresAt = new Date(now.getTime() + DELIVERY_OTP_TTL_MINUTES * 60 * 1000);

  const reservation = await Order.updateOne(
    {
      _id: orderId,
      supplierId,
      paymentStatus: { $in: ["paid", "captured"] },
      status: { $in: allowedStatuses },
      $or: [
        { deliveryOtpGeneratedAt: null },
        { deliveryOtpGeneratedAt: { $lte: cooldownCutoff } },
      ],
    },
    {
      $set: {
        deliveryOtpHash: otpHash,
        deliveryOtpExpiresAt: expiresAt,
        deliveryOtpAttempts: 0,
        deliveryOtpGeneratedAt: now,
        deliveryStatus: order.status === "out-for-delivery" ? "out-for-delivery" : "ready",
      },
    }
  );

  if (!reservation.matchedCount) {
    const error = new Error("A delivery OTP was recently sent. Please wait before requesting another.");
    error.code = "OTP_RESEND_COOLDOWN";
    throw error;
  }

  try {
    await passwordResetEmail.sendDeliveryOtp({
      email: customerEmail,
      username: customer.username,
      orderId: String(order._id),
      otp,
      expiresInMinutes: DELIVERY_OTP_TTL_MINUTES,
    });
  } catch (emailError) {
    const rollback = {
      $set: {
        deliveryOtpHash: null,
        deliveryOtpExpiresAt: null,
        deliveryOtpAttempts: 0,
        deliveryOtpGeneratedAt: null,
      },
    };
    if (Object.prototype.hasOwnProperty.call(order, "deliveryStatus")) {
      rollback.$set.deliveryStatus = order.deliveryStatus;
    } else {
      rollback.$unset = { deliveryStatus: 1 };
    }

    try {
      await Order.updateOne({ _id: orderId, supplierId, deliveryOtpHash: otpHash }, rollback);
    } catch (rollbackError) {
      console.error("Unable to invalidate delivery OTP after email failure", rollbackError.code || rollbackError.name || "UnknownError");
    }

    console.error("Delivery OTP email delivery failed", emailError.code || emailError.name || "UnknownError");
    const error = new Error("Unable to send the delivery OTP. Please try again.");
    error.code = "DELIVERY_OTP_EMAIL_FAILED";
    throw error;
  }

  return {
    expiresAt,
    attemptsAllowed: DELIVERY_OTP_MAX_ATTEMPTS,
  };
};

const getDeliveryOtpStatusForCustomer = async ({ orderId, userId }) => {
  const order = await Order.findOne({ _id: orderId, userId }).lean();

  if (!order) {
    const error = new Error("Order not found for this customer");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  const otpExists = Boolean(order.deliveryOtpHash && order.deliveryOtpExpiresAt && new Date(order.deliveryOtpExpiresAt) > new Date());
  return {
    orderId: String(order._id),
    status: order.deliveryStatus || order.status,
    otpAvailable: otpExists,
    expiresAt: order.deliveryOtpExpiresAt,
    message: otpExists ? "Your delivery OTP is available." : "No active delivery OTP for this order.",
  };
};

const verifyDeliveryOtp = async ({ orderId, supplierId, otp }) => {
  const order = await Order.findOne({ _id: orderId, supplierId }).select("+deliveryOtpHash").exec();

  if (!order) {
    const error = new Error("Order not found for this supplier");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  if (order.status === "delivered" || order.deliveryStatus === "completed") {
    const error = new Error("Order already delivered");
    error.code = "ORDER_ALREADY_DELIVERED";
    throw error;
  }

  if (!order.paymentStatus || !["paid", "captured"].includes(order.paymentStatus)) {
    const error = new Error("Payment not captured");
    error.code = "PAYMENT_NOT_CAPTURED";
    throw error;
  }

  if (!order.deliveryOtpHash || !order.deliveryOtpExpiresAt) {
    const error = new Error("Invalid delivery OTP");
    error.code = "INVALID_OTP";
    throw error;
  }

  if (new Date(order.deliveryOtpExpiresAt) < new Date()) {
    await Order.updateOne(
      { _id: orderId, supplierId },
      { $set: { deliveryOtpHash: null, deliveryOtpExpiresAt: null, deliveryOtpAttempts: DELIVERY_OTP_MAX_ATTEMPTS } }
    );
    const error = new Error("Delivery OTP has expired");
    error.code = "OTP_EXPIRED";
    throw error;
  }

  const otpValue = String(otp || "").trim();
  const candidateHash = toHash(otpValue);

  if (!secureCompare(candidateHash, order.deliveryOtpHash)) {
    const attempts = (order.deliveryOtpAttempts || 0) + 1;
    const expired = attempts >= DELIVERY_OTP_MAX_ATTEMPTS;

    await Order.updateOne(
      { _id: orderId, supplierId },
      {
        $set: {
          deliveryOtpAttempts: attempts,
          ...(expired ? { deliveryOtpHash: null, deliveryOtpExpiresAt: null } : {}),
        },
      }
    );

    if (expired) {
      const error = new Error("Maximum delivery OTP attempts exceeded");
      error.code = "OTP_ATTEMPTS_EXCEEDED";
      throw error;
    }

    const error = new Error("Invalid delivery OTP");
    error.code = "INVALID_OTP";
    throw error;
  }

  const verifiedAt = new Date();
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      supplierId,
      status: { $ne: "delivered" },
      deliveryStatus: { $ne: "completed" },
      paymentStatus: { $in: ["paid", "captured"] },
      deliveryOtpHash: order.deliveryOtpHash,
      deliveryOtpExpiresAt: { $gt: verifiedAt },
    },
    {
      $set: {
        status: "delivered",
        deliveryStatus: "completed",
        deliveryOtpVerifiedAt: verifiedAt,
        deliveryOtpHash: null,
        deliveryOtpExpiresAt: null,
        deliveryOtpAttempts: 0,
        supplierPayoutStatus: process.env.SUPPLIER_PAYOUT_ENABLED === "true" ? "pending" : "not_eligible",
      },
    },
    { new: true, runValidators: true }
  );

  if (updatedOrder) return updatedOrder;

  const current = await Order.findOne({ _id: orderId, supplierId }).select("+deliveryOtpHash").lean();
  if (!current) {
    const error = new Error("Order not found for this supplier");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }
  if (current.status === "delivered" || current.deliveryStatus === "completed") {
    const error = new Error("Order already delivered");
    error.code = "ORDER_ALREADY_DELIVERED";
    throw error;
  }
  if (!current.paymentStatus || !["paid", "captured"].includes(current.paymentStatus)) {
    const error = new Error("Payment not captured");
    error.code = "PAYMENT_NOT_CAPTURED";
    throw error;
  }
  if (current.deliveryOtpHash && current.deliveryOtpExpiresAt && new Date(current.deliveryOtpExpiresAt) <= verifiedAt) {
    await Order.updateOne(
      { _id: orderId, supplierId, deliveryOtpHash: current.deliveryOtpHash },
      { $set: { deliveryOtpHash: null, deliveryOtpExpiresAt: null, deliveryOtpAttempts: DELIVERY_OTP_MAX_ATTEMPTS } }
    );
    const error = new Error("Delivery OTP has expired");
    error.code = "OTP_EXPIRED";
    throw error;
  }

  const error = new Error("Invalid delivery OTP");
  error.code = "INVALID_OTP";
  throw error;
};

const initiateSupplierPayout = async ({ orderId, supplierId }) => {
  const order = await Order.findOne({ _id: orderId, supplierId }).populate("supplierId").lean();

  if (!order) {
    const error = new Error("Order not found for this supplier");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  if (!order.supplierId) {
    const error = new Error("Supplier not assigned to this order");
    error.code = "SUPPLIER_NOT_ASSIGNED";
    throw error;
  }

  const supplier = await Supplier.findById(order.supplierId._id || order.supplierId).lean();
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  if (supplier.approvalStatus !== "approved") {
    const error = new Error("Supplier is not approved for payouts");
    error.code = "SUPPLIER_NOT_APPROVED";
    throw error;
  }

  if (!order.deliveryOtpVerifiedAt) {
    const error = new Error("Delivery OTP verification is required before payout");
    error.code = "OTP_NOT_VERIFIED";
    throw error;
  }

  if (order.paymentStatus !== "paid" && order.paymentStatus !== "captured") {
    const error = new Error("Payment not captured");
    error.code = "PAYMENT_NOT_CAPTURED";
    throw error;
  }

  if (order.supplierPayoutStatus === "processing" || order.supplierPayoutStatus === "processed") {
    const error = new Error("Supplier payout already initiated for this order");
    error.code = "DUPLICATE_PAYOUT_ATTEMPT";
    throw error;
  }

  if (process.env.SUPPLIER_PAYOUT_ENABLED !== "true") {
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          supplierPayoutStatus: "not_eligible",
          supplierPayoutAmount: Number(order.pricing?.total || 0),
          supplierPayoutFailureReason: "Payouts are disabled in environment configuration",
        },
      }
    );
    return {
      success: true,
      payoutStatus: "not_eligible",
      skipped: true,
      message: "Supplier payouts are disabled in the current environment.",
    };
  }

  if (!supplier.razorpayLinkedAccountId) {
    const error = new Error("Supplier Razorpay linked account not configured");
    error.code = "SUPPLIER_PAYOUT_ACCOUNT_NOT_CONFIGURED";
    throw error;
  }

  const amountInPaise = Math.round(Number(order.pricing?.total || 0) * 100);
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const transfer = await razorpay.transfers.create({
    account: supplier.razorpayLinkedAccountId,
    amount: amountInPaise,
    currency: "INR",
    notes: {
      orderId: String(order._id),
      supplierId: String(supplier._id),
    },
    purpose: "payout",
  });

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, supplierId: supplier._id },
    {
      $set: {
        supplierPayoutStatus: "processing",
        supplierPayoutId: transfer.id,
        supplierPayoutAmount: Number(order.pricing?.total || 0),
        supplierPayoutInitiatedAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  );

  return {
    success: true,
    payoutStatus: "processing",
    transfer,
    order: updatedOrder,
  };
};

const ORDER_STATUS_VALUES = ["pending", "accepted", "in-production", "ready", "shipped", "out-for-delivery", "delivered", "cancelled"];
const PAYMENT_STATUS_VALUES = ["pending", "paid", "failed", "captured"];

const toSafeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const buildAdminOrderMap = async (orders = []) => {
  if (!orders.length) return { orders: [], userMap: new Map(), addressMap: new Map(), supplierMap: new Map() };

  const userIds = [...new Set(orders.map((order) => String(order.userId || "")).filter(Boolean))];
  const supplierIds = [...new Set(orders.map((order) => String(order.supplierId || "")).filter(Boolean))];

  const [users, addresses, suppliers] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("_id username email").lean(),
    Address.find({ userId: { $in: userIds } }).select("userId fullName phoneNumber email addressLine1 addressLine2 city state pincode country deliveryInstructions").lean(),
    Supplier.find({ _id: { $in: supplierIds } }).select("_id companyName ownerName businessEmail phoneNumber city state").lean(),
  ]);

  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const addressMap = new Map(addresses.map((address) => [String(address.userId), address]));
  const supplierMap = new Map(suppliers.map((supplier) => [String(supplier._id), supplier]));

  const mappedOrders = orders.map((order) => {
    const user = userMap.get(String(order.userId || "")) || {};
    const address = addressMap.get(String(order.userId || "")) || {};
    const supplier = order.supplierId ? supplierMap.get(String(order.supplierId)) || null : null;
    const amount = toSafeNumber(order.pricing?.total);
    const subtotal = toSafeNumber(order.pricing?.subtotal);
    const shipping = toSafeNumber(order.pricing?.shipping);
    const customerName = user.username || address.fullName || "Unknown Customer";
    const orderLocation = [address.city, address.state].filter(Boolean).join(", ") || "Not specified";

    return {
      ...order,
      orderId: String(order._id),
      customer: {
        id: user._id || null,
        name: customerName,
        email: user.email || address.email || "N/A",
        phone: address.phoneNumber || "N/A",
      },
      supplier: supplier ? {
        id: supplier._id,
        companyName: supplier.companyName || supplier.ownerName || "Unknown supplier",
        ownerName: supplier.ownerName || "N/A",
        businessEmail: supplier.businessEmail || "N/A",
        phoneNumber: supplier.phoneNumber || "N/A",
        city: supplier.city || "N/A",
        state: supplier.state || "N/A",
      } : null,
      deliveryAddress: {
        fullName: address.fullName || customerName,
        email: address.email || user.email || "N/A",
        phoneNumber: address.phoneNumber || "N/A",
        addressLine1: address.addressLine1 || "",
        addressLine2: address.addressLine2 || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "",
        deliveryInstructions: address.deliveryInstructions || "",
      },
      amount,
      subtotal,
      shipping,
      orderDate: order.createdAt,
      productName: order.bottleType || "Custom Bottle",
      deliveryLocation: orderLocation,
      paymentStatus: order.paymentStatus || "pending",
      status: order.status || "pending",
    };
  });

  return { orders: mappedOrders, userMap, addressMap, supplierMap };
};

const getOrderFilterFromQuery = ({ status, paymentStatus, startDate, endDate, search }) => {
  const filter = {};

  if (status && status !== "all") {
    const normalized = String(status).trim().toLowerCase();
    if (ORDER_STATUS_VALUES.includes(normalized)) {
      filter.status = normalized;
    }
  }

  if (paymentStatus && paymentStatus !== "all") {
    const normalized = String(paymentStatus).trim().toLowerCase();
    if (PAYMENT_STATUS_VALUES.includes(normalized)) {
      filter.paymentStatus = normalized;
    }
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime())) filter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
  }

  if (search) {
    const term = String(search).trim();
    if (term) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { _id: mongoose.isValidObjectId(term) ? new mongoose.Types.ObjectId(term) : undefined },
        { bottleType: regex },
        { brandName: regex },
        { printing: regex },
        { paymentMethod: regex },
        { status: regex },
        { paymentStatus: regex },
      ].filter(Boolean);
    }
  }

  return filter;
};

const getAdminOrdersList = async ({
  search,
  status,
  paymentStatus,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  sortBy = "newest",
  sortOrder = "desc",
} = {}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));
  const filter = getOrderFilterFromQuery({ search, status, paymentStatus, startDate, endDate });

  if (search) {
    const searchTerm = String(search).trim();
    if (searchTerm) {
      const relatedUsers = await User.find({
        $or: [
          { username: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { email: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        ],
      }).select("_id").lean();

      const relatedAddress = await Address.find({
        $or: [
          { fullName: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { phoneNumber: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { email: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { city: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { state: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { pincode: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { country: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        ],
      }).select("userId").lean();

      const userIds = [...new Set([...relatedUsers.map((user) => String(user._id)), ...relatedAddress.map((address) => String(address.userId))])];
      const searchMatch = { userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } };

      if (userIds.length) {
        filter.$or = [
          ...(Array.isArray(filter.$or) ? filter.$or : []),
          searchMatch,
        ];
      }
    }
  }

  const total = await Order.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limitNumber));

  const sortKeyMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { "pricing.total": -1 },
    lowest: { "pricing.total": 1 },
  };

  const sortKey = sortKeyMap[String(sortBy || "newest").toLowerCase()] || { createdAt: -1 };
  const finalSort = sortOrder === "asc" ? { ...sortKey, createdAt: 1 } : sortKey;

  const orders = await Order.find(filter)
    .sort(finalSort)
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .lean();

  const { orders: mappedOrders } = await buildAdminOrderMap(orders);

  return {
    orders: mappedOrders,
    summary: {
      totalOrders: total,
      pendingOrders: await Order.countDocuments({ ...filter, status: "pending" }),
      processingOrders: await Order.countDocuments({
        ...filter,
        status: { $in: ["accepted", "in-production", "ready", "shipped", "out-for-delivery"] },
      }),
      deliveredOrders: await Order.countDocuments({ ...filter, status: "delivered" }),
      cancelledOrders: await Order.countDocuments({ ...filter, status: "cancelled" }),
      totalRevenue: await Order.aggregate([
        { $match: { ...filter, paymentStatus: { $in: ["paid", "captured"] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$pricing.total", 0] } } } },
      ]).then((result) => Number((result[0]?.total || 0).toFixed(2))),
    },
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: total,
      pageSize: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    },
  };
};

const getAdminOrderStats = async ({
  search,
  status,
  paymentStatus,
  startDate,
  endDate,
} = {}) => {
  const filter = getOrderFilterFromQuery({ search, status, paymentStatus, startDate, endDate });

  const [summary] = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        processingOrders: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$status",
                  ["accepted", "in-production", "ready", "shipped", "out-for-delivery"],
                ],
              },
              1,
              0,
            ],
          },
        },
        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        totalRevenue: {
          $sum: {
            $cond: [
              { $in: ["$paymentStatus", ["paid", "captured"]] },
              { $ifNull: ["$pricing.total", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    totalOrders: Number(summary?.totalOrders || 0),
    pendingOrders: Number(summary?.pendingOrders || 0),
    processingOrders: Number(summary?.processingOrders || 0),
    deliveredOrders: Number(summary?.deliveredOrders || 0),
    cancelledOrders: Number(summary?.cancelledOrders || 0),
    totalRevenue: Number((summary?.totalRevenue || 0).toFixed(2)),
  };
};

const getAdminOrderById = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID");
    error.code = "INVALID_ORDER_ID";
    throw error;
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    const error = new Error("Order not found");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  const [customer, address, supplier] = await Promise.all([
    User.findById(order.userId).select("_id username email").lean(),
    Address.findOne({ userId: order.userId }).select("userId fullName phoneNumber email addressLine1 addressLine2 city state pincode country deliveryInstructions").lean(),
    order.supplierId ? Supplier.findById(order.supplierId).select("_id companyName ownerName businessEmail phoneNumber city state").lean() : null,
  ]);

  return {
    ...order,
    customer: customer ? { id: customer._id, name: customer.username || "Unknown Customer", email: customer.email || "N/A" } : null,
    supplier: supplier ? ({
      id: supplier._id,
      companyName: supplier.companyName || supplier.ownerName || "Unknown supplier",
      ownerName: supplier.ownerName || "N/A",
      businessEmail: supplier.businessEmail || "N/A",
      phoneNumber: supplier.phoneNumber || "N/A",
      city: supplier.city || "N/A",
      state: supplier.state || "N/A",
    }) : null,
    deliveryAddress: address ? {
      fullName: address.fullName || customer?.username || "N/A",
      phoneNumber: address.phoneNumber || "N/A",
      email: address.email || customer?.email || "N/A",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "",
      deliveryInstructions: address.deliveryInstructions || "",
    } : null,
    amount: toSafeNumber(order.pricing?.total),
    subtotal: toSafeNumber(order.pricing?.subtotal),
    shipping: toSafeNumber(order.pricing?.shipping),
    productName: order.bottleType || "Custom Bottle",
    orderId: String(order._id),
  };
};

const updateAdminOrderStatus = async (orderId, status) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (!ORDER_STATUS_VALUES.includes(normalizedStatus)) {
    const error = new Error("Invalid order status value");
    error.code = "INVALID_ORDER_STATUS";
    throw error;
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: { status: normalizedStatus, updatedAt: new Date() } },
    { new: true, runValidators: true }
  );

  if (!order) {
    const error = new Error("Order not found");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  return order;
};

const buildAdminOrdersCsv = async ({ search, status, paymentStatus, startDate, endDate } = {}) => {
  const { orders } = await getAdminOrdersList({ search, status, paymentStatus, startDate, endDate, page: 1, limit: 5000, sortBy: "newest", sortOrder: "desc" });

  const headers = [
    "Order ID",
    "Customer",
    "Email",
    "Phone",
    "Product",
    "Quantity",
    "Amount",
    "Payment Status",
    "Order Status",
    "Location",
    "Order Date",
  ];

  const rows = orders.map((order) => [
    order.orderId || "",
    order.customer?.name || "",
    order.customer?.email || "",
    order.customer?.phone || "",
    order.productName || "",
    String(order.quantity || 0),
    String(order.amount || 0),
    order.paymentStatus || "pending",
    order.status || "pending",
    order.deliveryLocation || "",
    new Date(order.createdAt || Date.now()).toISOString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return csv;
};

module.exports = {
  createOrder,
  getOrdersByUser,
  getOrderById,
  getCustomerOrderById,
  getOrderByRazorpayId,
  updateOrder,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  initiateSupplierPayout,
  getDeliveryOtpStatusForCustomer,
  getAdminOrdersList,
  getAdminOrderStats,
  getAdminOrderById,
  updateAdminOrderStatus,
  buildAdminOrdersCsv,
};