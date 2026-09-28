const Supplier = require("../MODELS/supplier");
const Order = require("../MODELS/orderModel");
const SupportRequest = require("../MODELS/supportRequest");
const User = require("../MODELS/usermodel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ALLOWED_STATUS_TRANSITIONS = {
    accepted: ["pending"],
    cancelled: ["pending"],
    "in-production": ["accepted"],
    ready: ["in-production"],
    shipped: ["ready"],
    "out-for-delivery": ["shipped"],
};

const createSupplier = async ({ supplierData }) => {
    const existingEmail = await Supplier.findOne({
        businessEmail: supplierData.businessEmail
    });

    if (existingEmail) {
        const error = new Error("Business email already registered");
        error.code = "DUPLICATE_EMAIL";
        throw error;
    }

    const existingGst = await Supplier.findOne({ gstNumber: supplierData.gstNumber });

    if (existingGst) {
        const error = new Error("GST number already registered");
        error.code = "DUPLICATE_GST";
        throw error;
    }

    const hashedPassword = await bcrypt.hash(supplierData.password, 10);

    return Supplier.create({
        companyName: supplierData.companyName,
        ownerName: supplierData.ownerName,
        businessEmail: supplierData.businessEmail,
        phoneNumber: supplierData.phoneNumber,
        city: supplierData.city,
        state: supplierData.state,
        productionCapacity: supplierData.productionCapacity,
        gstNumber: supplierData.gstNumber,
        accountHolderName: supplierData.accountHolderName,
        accountNumber: supplierData.accountNumber,
        ifscCode: supplierData.ifscCode,
        fssaiCertificate: supplierData.fssaiCertificate,
        gstCertificate: supplierData.gstCertificate,
        password: hashedPassword,
        role: "supplier",
        isActive: false,
        approvalStatus: "pending",
        requestedAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        removedAt: null,
        payoutEnabled: false,
        payoutStatus: "not_eligible",
    });
};

const loginSupplier = async ({ businessEmail, password }) => {
    const normalizedEmail = String(businessEmail || "").trim().toLowerCase();
    if (!normalizedEmail || typeof password !== "string" || !password) {
        const error = new Error("Invalid email or password");
        error.code = "INVALID_CREDENTIALS";
        throw error;
    }

    const supplier = await Supplier.findOne({ businessEmail: normalizedEmail }).select("+password");

    if (!supplier) {
        const error = new Error("Invalid email or password");
        error.code = "INVALID_CREDENTIALS";
        throw error;
    }

    const isMatch = await bcrypt.compare(
        password,
        supplier.password
    );

    if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.code = "INVALID_CREDENTIALS";
        throw error;
    }

    if (supplier.approvalStatus !== "approved" || supplier.isActive !== true) {
        const error = new Error("Supplier account is pending approval or has been removed");
        error.code = "SUPPLIER_NOT_APPROVED";
        throw error;
    }

    const token = jwt.sign(
        { id: supplier._id, role: "supplier" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        supplier,
        token
    };
};

const updateSupplierProfile = async ({ supplierId, profileData }) => {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
        const error = new Error("Supplier not found");
        error.code = "SUPPLIER_NOT_FOUND";
        throw error;
    }

    Object.assign(supplier, profileData);
    return supplier.save();
};

const createSupportRequest = async ({ supplierId, subject, message }) => SupportRequest.create({
    supplierId,
    subject,
    message,
});

const getSupplierSupportContact = async () => {
    const admin = await User.findOne({ role: "admin" }).select("username email").lean();
    return admin ? { name: admin.username, email: admin.email } : null;
};

const getSupplierInvoices = async (supplierId) => {
    const orders = await Order.find({ supplierId }).sort({ createdAt: -1 }).lean();
    const toStatus = (status) => status === "delivered" ? "Paid" : status === "cancelled" ? "Failed" : "Pending";
    const invoices = orders.map((order) => ({
        invoiceId: `INV-${String(order._id).slice(-8).toUpperCase()}`,
        orderId: String(order._id),
        date: order.createdAt,
        amount: Number(order.pricing?.total || 0),
        status: toStatus(order.status),
    }));
    const payments = orders.filter((order) => order.status !== "cancelled").map((order) => ({
        paymentId: `PAY-${String(order._id).slice(-8).toUpperCase()}`,
        orderId: String(order._id),
        date: order.createdAt,
        amount: Number(order.pricing?.total || 0),
        status: order.status === "delivered" ? "Paid" : "Pending",
        paymentMethod: "Not recorded",
    }));

    return { invoices, payments };
};

const resolveSupplier = async (supplierId) => {
    const supplier = await Supplier.findById(supplierId).lean();

    if (!supplier) {
        const error = new Error("Supplier not found");
        error.code = "SUPPLIER_NOT_FOUND";
        throw error;
    }

    return supplier;
};

const enrichOrdersWithCustomerData = async (orders = []) => {
    const customerIds = [...new Set(orders.map((order) => String(order.userId)).filter(Boolean))];

    if (!customerIds.length) {
        return orders.map((order) => ({
            ...order,
            customer: null,
            deliveryAddress: null,
        }));
    }

    const [customers, addresses] = await Promise.all([
        require("../MODELS/usermodel").find({ _id: { $in: customerIds } }).select("username email").lean(),
        require("../MODELS/addressModel").find({ userId: { $in: customerIds } }).select("userId fullName phoneNumber email addressLine1 addressLine2 city state pincode country deliveryInstructions").lean(),
    ]);

    const customersById = new Map(customers.map((customer) => [String(customer._id), customer]));
    const addressesByUserId = new Map(addresses.map((address) => [String(address.userId), address]));

    return orders.map((order) => ({
        ...order,
        customer: customersById.get(String(order.userId)) || null,
        deliveryAddress: addressesByUserId.get(String(order.userId)) || null,
    }));
};

const buildNotifications = ({ orders = [], incomingOrders = [] }) => {
    const notifications = [];

    if (incomingOrders.length) {
        notifications.push({
            id: "incoming-orders",
            type: "Orders",
            title: "New orders available",
            message: `${incomingOrders.length} paid order${incomingOrders.length > 1 ? "s" : ""} are waiting for your confirmation.`,
            time: "Now",
            read: false,
            icon: "PackageCheck",
            tone: "blue",
        });
    }

    const latestAccepted = [...orders]
        .filter((order) => ["accepted", "in-production", "ready", "shipped", "delivered"].includes(order.status))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];

    if (latestAccepted) {
        notifications.push({
            id: `status-${latestAccepted._id}`,
            type: "Orders",
            title: "Order status updated",
            message: `Order ${String(latestAccepted._id).slice(-6)} is now ${latestAccepted.status}.`,
            time: "Recent",
            read: false,
            icon: "ClipboardList",
            tone: "orange",
        });
    }

    const completedCount = orders.filter((order) => order.status === "delivered").length;
    if (completedCount) {
        notifications.push({
            id: "completed-orders",
            type: "Payments",
            title: "Completed orders",
            message: `${completedCount} delivered order${completedCount > 1 ? "s" : ""} have been recorded for your payouts.`,
            time: "Recent",
            read: false,
            icon: "Wallet",
            tone: "green",
        });
    }

    return notifications.slice(0, 5);
};

const getAdminDashboardStats = async () => {
    const [totalSuppliers, pendingRequests, activeSuppliers, inactiveSuppliers] = await Promise.all([
        Supplier.countDocuments({ role: "supplier" }),
        Supplier.countDocuments({ role: "supplier", approvalStatus: "pending" }),
        Supplier.countDocuments({ role: "supplier", approvalStatus: "approved", isActive: true }),
        Supplier.countDocuments({
            role: "supplier",
            $or: [
                { approvalStatus: "removed" },
                { approvalStatus: "rejected" },
                { approvalStatus: "suspended" },
                { isActive: false },
            ],
        }),
    ]);

    return {
        totalSuppliers,
        pendingRequests,
        approvedSuppliers: activeSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        removedSuppliers: inactiveSuppliers,
    };
};

const getAdminSupplierRequests = async () => {
    const suppliers = await Supplier.find({ role: "supplier", approvalStatus: "pending" })
        .sort({ requestedAt: -1 })
        .select("+fssaiCertificate +gstCertificate")
        .lean();

    return suppliers.map((supplier) => {
        const { fssaiCertificate, gstCertificate, ...safeSupplier } = supplier;
        return {
            ...safeSupplier,
            id: supplier._id,
            status: supplier.approvalStatus,
            documents: {
                fssai: { uploaded: Boolean(fssaiCertificate) },
                gst: { uploaded: Boolean(gstCertificate) },
            },
        };
    });
};

const getAdminSuppliersList = async ({ search = "", status = "all", page = 1, limit = 10 } = {}) => {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const searchTerm = String(search || "").trim();
    const filter = { role: "supplier" };

    if (status && status !== "all") {
        if (status === "active") {
            filter.approvalStatus = "approved";
            filter.isActive = true;
        } else if (status === "pending") {
            filter.approvalStatus = "pending";
        } else if (status === "inactive") {
            filter.$or = [
                { approvalStatus: "removed" },
                { approvalStatus: "rejected" },
                { approvalStatus: "suspended" },
                { isActive: false },
            ];
        }
    }

    if (searchTerm) {
        const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { companyName: new RegExp(escaped, "i") },
            { ownerName: new RegExp(escaped, "i") },
            { businessEmail: new RegExp(escaped, "i") },
            { phoneNumber: new RegExp(escaped, "i") },
            { city: new RegExp(escaped, "i") },
            { state: new RegExp(escaped, "i") },
        ];
    }

    const skip = (normalizedPage - 1) * normalizedLimit;
    const [suppliers, total] = await Promise.all([
        Supplier.find(filter)
            .sort({ approvedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(normalizedLimit)
            .select("+fssaiCertificate +gstCertificate")
            .lean(),
        Supplier.countDocuments(filter),
    ]);

    return {
        suppliers: suppliers.map((supplier) => {
            const { fssaiCertificate, gstCertificate, ...safeSupplier } = supplier;
            return {
                ...safeSupplier,
                id: supplier._id,
                status: supplier.approvalStatus,
                documents: {
                    fssai: { uploaded: Boolean(fssaiCertificate) },
                    gst: { uploaded: Boolean(gstCertificate) },
                },
            };
        }),
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    };
};

const getSupplierByIdForAdmin = async (supplierId) => {
    const supplier = await Supplier.findById(supplierId)
        .select("+accountHolderName +accountNumber +ifscCode +fssaiCertificate +gstCertificate")
        .lean();
    if (!supplier) {
        const error = new Error("Supplier not found");
        error.code = "SUPPLIER_NOT_FOUND";
        throw error;
    }

    const { accountHolderName, accountNumber, ifscCode, fssaiCertificate, gstCertificate, ...safeSupplier } = supplier;
    return {
        ...safeSupplier,
        id: supplier._id,
        status: supplier.approvalStatus,
        accountHolderName: accountHolderName || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        documents: {
            fssai: { uploaded: Boolean(fssaiCertificate) },
            gst: { uploaded: Boolean(gstCertificate) },
        },
    };
};

const removeSupplierAccount = async ({ supplierId, adminId }) => {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        const error = new Error("Supplier not found");
        error.code = "SUPPLIER_NOT_FOUND";
        throw error;
    }

    if (supplier.approvalStatus === "removed") {
        const error = new Error("Supplier is already removed");
        error.code = "SUPPLIER_ALREADY_REMOVED";
        throw error;
    }

    supplier.approvalStatus = "removed";
    supplier.isActive = false;
    supplier.role = "customer";
    supplier.removedAt = new Date();
    supplier.approvedBy = adminId;
    supplier.payoutEnabled = false;
    supplier.payoutStatus = "not_eligible";
    await supplier.save();

    return { ...supplier.toObject(), id: supplier._id, status: supplier.approvalStatus };
};

const getSupplierDashboard = async (supplierId) => {
    const supplier = await resolveSupplier(supplierId);

    const [orders, incomingOrders] = await Promise.all([
        Order.find({ supplierId }).sort({ createdAt: -1 }).lean(),
        Order.find({
            status: "pending",
            paymentStatus: "paid",
            supplierId: null,
        }).sort({ createdAt: -1 }).lean(),
    ]);

    const [enrichedOrders, enrichedIncomingOrders] = await Promise.all([
        enrichOrdersWithCustomerData(orders),
        enrichOrdersWithCustomerData(incomingOrders),
    ]);

    const completedOrders = orders.filter((order) => order.status === "delivered");
    const cancelledOrders = orders.filter((order) => order.status === "cancelled");
    const activeOrders = orders.filter((order) => ["accepted", "in-production", "ready", "shipped", "out-for-delivery"].includes(order.status));
    const pendingOrders = orders.filter((order) => order.status === "pending");
    const profileFields = [
        supplier.companyName,
        supplier.ownerName,
        supplier.businessEmail,
        supplier.phoneNumber,
        supplier.city,
        supplier.state,
        supplier.productionCapacity,
        supplier.gstNumber,
    ];
    const profileCompletion = Math.round(
        (profileFields.filter(Boolean).length / profileFields.length) * 100
    );

    return {
        supplier: {
            id: supplier._id,
            supplierId: supplier._id,
            companyName: supplier.companyName,
            ownerName: supplier.ownerName,
            businessEmail: supplier.businessEmail,
            phoneNumber: supplier.phoneNumber,
            city: supplier.city,
            state: supplier.state,
            productionCapacity: supplier.productionCapacity,
            gstNumber: supplier.gstNumber,
            approvalStatus: supplier.approvalStatus,
            payoutEnabled: supplier.payoutEnabled,
            payoutStatus: supplier.payoutStatus,
            createdAt: supplier.createdAt,
        },
        stats: {
            totalOrders: orders.length,
            pendingOrders: pendingOrders.length,
            completedOrders: completedOrders.length,
            cancelledOrders: cancelledOrders.length,
            totalEarnings: completedOrders.reduce(
                (total, order) => total + Number(order.pricing?.total || 0),
                0
            ),
        },
        profileCompletion,
        recentOrders: enrichedOrders.slice(0, 5),
        activeOrders: enrichedOrders.filter((order) => ["accepted", "in-production", "ready", "shipped", "out-for-delivery"].includes(order.status)),
        incomingOrders: enrichedIncomingOrders,
        notifications: buildNotifications({ orders, incomingOrders }),
    };
};

const getSupplierOrders = async (supplierId) => {
    const supplier = await resolveSupplier(supplierId);
    const orders = await Order.find({ supplierId }).sort({ createdAt: -1 }).lean();
    const enrichedOrders = await enrichOrdersWithCustomerData(orders);

    return {
        supplier: {
            id: supplier._id,
            supplierId: supplier._id,
            companyName: supplier.companyName,
        },
        summary: {
            totalOrders: orders.length,
            pendingOrders: orders.filter((order) => order.status === "pending").length,
            inProductionOrders: orders.filter((order) => ["accepted", "in-production"].includes(order.status)).length,
            shippedOrders: orders.filter((order) => ["ready", "shipped", "out-for-delivery"].includes(order.status)).length,
            deliveredOrders: orders.filter((order) => order.status === "delivered").length,
            cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
        },
        orders: enrichedOrders,
    };
};

const getSupplierOrderById = async ({ supplierId, orderId }) => {
    const supplier = await resolveSupplier(supplierId);
    const order = await Order.findOne({ _id: orderId, supplierId }).lean();

    if (!order) {
        const error = new Error("Order not found");
        error.code = "ORDER_NOT_FOUND";
        throw error;
    }

    const [customer, deliveryAddress] = await Promise.all([
        require("../MODELS/usermodel").findById(order.userId).select("username email").lean(),
        require("../MODELS/addressModel").findOne({ userId: order.userId }).select("userId fullName phoneNumber email addressLine1 addressLine2 city state pincode country deliveryInstructions").lean(),
    ]);

    return {
        supplier: {
            id: supplier._id,
            companyName: supplier.companyName,
        },
        order: {
            ...order,
            customer: customer || null,
            deliveryAddress: deliveryAddress || null,
        },
    };
};

const updateSupplierOrderStatus = async ({ supplierId, orderId, status }) => {
    if (status === "delivered") {
        const error = new Error("Order completion must be verified using the delivery OTP flow");
        error.code = "INVALID_STATUS";
        throw error;
    }

    const previousStatuses = ALLOWED_STATUS_TRANSITIONS;
    if (!previousStatuses[status]) {
        const error = new Error("Unsupported supplier order status");
        error.code = "INVALID_STATUS";
        throw error;
    }

    const ownership = status === "accepted" || status === "cancelled"
        ? { $or: [{ supplierId: null }, { supplierId }] }
        : { supplierId };
    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            paymentStatus: { $in: ["paid", "captured"] },
            status: { $in: previousStatuses[status] },
            ...ownership,
        },
        {
            $set: {
                status,
                deliveryStatus: status === "ready" ? "ready" : status === "shipped" ? "shipped" : status === "out-for-delivery" ? "out-for-delivery" : "pending",
                ...(status === "accepted" ? { supplierId } : {}),
            },
        },
        { new: true, runValidators: true }
    ).lean();

    if (!order) {
        const error = new Error("Order is no longer available for this action");
        error.code = "ORDER_NOT_AVAILABLE";
        throw error;
    }

    return order;
};

const getSupplierEarnings = async ({ supplierId, months = 6 }) => {
    const monthCount = Math.min(Math.max(Number(months) || 6, 1), 12);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const chartStart = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1);
    const orders = await Order.find({ supplierId }).sort({ createdAt: -1 }).lean();
    const completedOrders = orders.filter((order) => order.status === "delivered");
    const pendingOrders = orders.filter((order) => [
        "pending",
        "accepted",
        "in-production",
        "ready",
    ].includes(order.status));
    const totalEarnings = completedOrders.reduce((total, order) => total + Number(order.pricing?.total || 0), 0);
    const currentMonthEarnings = completedOrders
        .filter((order) => new Date(order.createdAt) >= currentMonthStart)
        .reduce((total, order) => total + Number(order.pricing?.total || 0), 0);
    const monthlyEarnings = Array.from({ length: monthCount }, (_, index) => {
        const monthDate = new Date(chartStart.getFullYear(), chartStart.getMonth() + index, 1);
        const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        const value = completedOrders
            .filter((order) => {
                const createdAt = new Date(order.createdAt);
                return createdAt >= monthDate && createdAt < nextMonth;
            })
            .reduce((total, order) => total + Number(order.pricing?.total || 0), 0);

        return {
            label: monthDate.toLocaleString("en-US", { month: "short" }),
            value,
        };
    });
    const transactions = completedOrders.slice(0, 10).map((order) => ({
        date: new Date(order.createdAt).toLocaleDateString("en-IN"),
        orderId: String(order._id),
        amount: Number(order.pricing?.total || 0),
        status: "Delivered",
        paymentMode: "Not recorded",
    }));

    return {
        totalEarnings,
        currentMonthEarnings,
        pendingPayments: pendingOrders.reduce((total, order) => total + Number(order.pricing?.total || 0), 0),
        currentMonthLabel: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
        monthlyEarnings,
        transactions,
    };
};




module.exports = {
    createSupplier,
    loginSupplier,
    updateSupplierProfile,
    createSupportRequest,
    getSupplierSupportContact,
    getSupplierInvoices,
    resolveSupplier,
    getSupplierDashboard,
    getSupplierOrders,
    getSupplierOrderById,
    updateSupplierOrderStatus,
    getSupplierEarnings,
    getAdminDashboardStats,
    getAdminSupplierRequests,
    getAdminSuppliersList,
    getSupplierByIdForAdmin,
    removeSupplierAccount,
};

