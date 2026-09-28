const supplierservices = require("../Services/supplierService");
const orderService = require("../Services/orderService");
const Supplier = require("../MODELS/supplier");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const cleanupSupplierDocuments = (req) => {
    Object.values(req.files || {}).flat().forEach((file) => fs.unlink(file.path, () => {}));
};

const signupError = (req, res, status, message) => {
    cleanupSupplierDocuments(req);
    return res.status(status).json({ success: false, message });
};

const registerSupplier = async (req, res) => {
    try {
        const {
            companyName,
            ownerName,
            businessEmail,
            phoneNumber,
            city,
            state,
            productionCapacity,
            gstNumber,
            accountHolderName,
            accountNumber,
            ifscCode,
            password,
            confirmPassword,
            termsAccepted
        } = req.body || {};

        const requiredFields = {
            companyName,
            ownerName,
            businessEmail,
            phoneNumber,
            city,
            state,
            productionCapacity,
            gstNumber,
            accountHolderName,
            accountNumber,
            ifscCode,
            password,
            confirmPassword
        };

        const missingField = Object.entries(requiredFields)
            .find(([, value]) => value === undefined || value === null || String(value).trim() === "");

        if (missingField) {
            return signupError(req, res, 400, `${missingField[0]} is required`);
        }

        if (!/^\S+@\S+\.\S+$/.test(String(businessEmail).trim())) {
            return signupError(req, res, 400, "Valid business email is required");
        }

        if (password !== confirmPassword) {
            return signupError(req, res, 400, "Passwords do not match");
        }

        if (String(password).length < 6) {
            return signupError(req, res, 400, "Password must be at least 6 characters long");
        }

        const capacity = Number(productionCapacity);
        if (!Number.isInteger(capacity) || capacity < 1) {
            return signupError(req, res, 400, "Production capacity must be a positive whole number");
        }

        if (termsAccepted !== undefined && termsAccepted !== true && termsAccepted !== "true") {
            return signupError(req, res, 400, "Terms and conditions must be accepted");
        }

        const normalizedAccountHolder = String(accountHolderName).trim();
        const normalizedAccountNumber = String(accountNumber).trim();
        const normalizedIfsc = String(ifscCode).trim().toUpperCase();
        if (!/^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u.test(normalizedAccountHolder)) {
            return signupError(req, res, 400, "Enter a valid account holder name");
        }
        if (!/^\d{9,18}$/.test(normalizedAccountNumber)) {
            return signupError(req, res, 400, "Bank account number must contain 9 to 18 digits");
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
            return signupError(req, res, 400, "Enter a valid IFSC code");
        }

        const fssaiCertificate = req.files?.fssaiCertificate?.[0];
        const gstCertificate = req.files?.gstCertificate?.[0];
        if (!fssaiCertificate || !gstCertificate) {
            return signupError(req, res, 400, "FSSAI and GST certificates are required");
        }

        const supplier = await supplierservices.createSupplier({
            supplierData: {
                companyName: String(companyName).trim(),
                ownerName: String(ownerName).trim(),
                businessEmail: String(businessEmail).trim().toLowerCase(),
                phoneNumber: String(phoneNumber).trim(),
                city: String(city).trim(),
                state: String(state).trim(),
                productionCapacity: capacity,
                gstNumber: String(gstNumber).trim().toUpperCase(),
                accountHolderName: normalizedAccountHolder,
                accountNumber: normalizedAccountNumber,
                ifscCode: normalizedIfsc,
                fssaiCertificate: fssaiCertificate.filename,
                gstCertificate: gstCertificate.filename,
                password
            }
        });

        const token = jwt.sign(
            { id: supplier._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            success: true,
            message: "Supplier registered successfully",
            token,
            supplier: {
                id: supplier._id,
                companyName: supplier.companyName,
                ownerName: supplier.ownerName,
                businessEmail: supplier.businessEmail,
                phoneNumber: supplier.phoneNumber,
                city: supplier.city,
                state: supplier.state,
                productionCapacity: supplier.productionCapacity,
                gstNumber: supplier.gstNumber,
                createdAt: supplier.createdAt
            }
        });
    } catch (error) {
        cleanupSupplierDocuments(req);
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                success: false,
                message: duplicateField === "gstNumber"
                    ? "GST number already registered"
                    : "Business email already registered"
            });
        }

        if (error.code === "DUPLICATE_EMAIL" || error.code === "DUPLICATE_GST") {
            return res.status(409).json({ success: false, message: error.message });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.status(500).json({ success: false, message: "Unable to register supplier" });

    }
};

const getSupplierSupportContact = async (req, res) => {
    try {
        const contact = await supplierservices.getSupplierSupportContact();
        return res.status(200).json({ success: true, contact });
    } catch {
        return res.status(500).json({ success: false, message: "Unable to load support contact" });
    }
};

const getSupplierDashboard = async (req, res) => {
    try {
        const dashboard = await supplierservices.getSupplierDashboard(req.user.id);

        return res.status(200).json({
            success: true,
            ...dashboard,
        });
    } catch (error) {
        console.error("GET SUPPLIER DASHBOARD ERROR:", error);

        if (error.code === "SUPPLIER_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getSupplierOrders = async (req, res) => {
    try {
        const supplierOrders = await supplierservices.getSupplierOrders(req.user.id);
        return res.status(200).json({
            success: true,
            ...supplierOrders,
        });
    } catch (error) {
        console.error("GET SUPPLIER ORDERS ERROR:", error);

        if (error.code === "SUPPLIER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: error.message });
        }

        return res.status(500).json({ success: false, message: "Unable to load supplier orders" });
    }
};

const getSupplierOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await supplierservices.getSupplierOrderById({
            supplierId: req.user.id,
            orderId,
        });

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("GET SUPPLIER ORDER DETAILS ERROR:", error);

        if (error.code === "SUPPLIER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: error.message });
        }

        if (error.code === "ORDER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: error.message });
        }

        return res.status(500).json({ success: false, message: "Unable to load order details" });
    }
};

const updateSupplierOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body || {};
        const order = await supplierservices.updateSupplierOrderStatus({
            supplierId: req.user.id,
            orderId,
            status,
        });

        return res.status(200).json({ success: true, order });
    } catch (error) {
        if (error.code === "INVALID_STATUS") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "ORDER_NOT_AVAILABLE") return res.status(409).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: "Unable to update supplier order" });
    }
};

const generateDeliveryOtpForOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        await orderService.generateDeliveryOtp({ orderId, supplierId: req.user.id });
        return res.status(200).json({ success: true, message: "Delivery OTP generated successfully" });
    } catch (error) {
        if (error.code === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: error.message });
        if (error.code === "PAYMENT_NOT_CAPTURED") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "ORDER_NOT_READY") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "SUPPLIER_NOT_ASSIGNED") return res.status(403).json({ success: false, message: error.message });
        if (error.code === "ORDER_NOT_ELIGIBLE") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "CUSTOMER_EMAIL_UNAVAILABLE") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "OTP_RESEND_COOLDOWN") return res.status(429).json({ success: false, message: error.message });
        if (error.code === "DELIVERY_OTP_EMAIL_FAILED") return res.status(502).json({ success: false, message: "Unable to send the delivery OTP. Please try again." });
        return res.status(500).json({ success: false, message: "Unable to generate delivery OTP" });
    }
};

const verifyDeliveryOtpForOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { otp } = req.body || {};
        if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

        const order = await orderService.verifyDeliveryOtp({ orderId, supplierId: req.user.id, otp });
        return res.status(200).json({ success: true, message: "Delivery completed successfully", order });
    } catch (error) {
        if (error.code === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: error.message });
        if (error.code === "ORDER_ALREADY_DELIVERED") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "PAYMENT_NOT_CAPTURED") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "INVALID_OTP") return res.status(400).json({ success: false, message: "Invalid delivery OTP" });
        if (error.code === "OTP_EXPIRED") return res.status(400).json({ success: false, message: "Delivery OTP has expired" });
        if (error.code === "OTP_ATTEMPTS_EXCEEDED") return res.status(400).json({ success: false, message: "Maximum delivery OTP attempts exceeded" });
        return res.status(500).json({ success: false, message: "Unable to verify delivery OTP" });
    }
};

const initiateSupplierPayoutForOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await orderService.initiateSupplierPayout({ orderId, supplierId: req.user.id });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        if (error.code === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: error.message });
        if (error.code === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: error.message });
        if (error.code === "SUPPLIER_NOT_ASSIGNED") return res.status(403).json({ success: false, message: error.message });
        if (error.code === "SUPPLIER_NOT_APPROVED") return res.status(403).json({ success: false, message: error.message });
        if (error.code === "OTP_NOT_VERIFIED") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "SUPPLIER_PAYOUT_ACCOUNT_NOT_CONFIGURED") return res.status(400).json({ success: false, message: error.message });
        if (error.code === "DUPLICATE_PAYOUT_ATTEMPT") return res.status(409).json({ success: false, message: error.message });
        if (error.code === "PAYMENT_NOT_CAPTURED") return res.status(400).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: "Unable to initiate supplier payout" });
    }
};

const getPendingSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ approvalStatus: "pending" }).select("-password").lean();
        return res.status(200).json({ success: true, suppliers });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to load pending suppliers" });
    }
};

const approveSupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const supplier = await Supplier.findByIdAndUpdate(supplierId, { approvalStatus: "approved", payoutEnabled: true }, { new: true }).select("-password");
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
        return res.status(200).json({ success: true, supplier });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to approve supplier" });
    }
};

const rejectSupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const supplier = await Supplier.findByIdAndUpdate(supplierId, { approvalStatus: "rejected", payoutEnabled: false }, { new: true }).select("-password");
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
        return res.status(200).json({ success: true, supplier });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to reject supplier" });
    }
};

const loginSupplier = async (req, res) => {

    try {

        const { businessEmail, Businessemail, password } = req.body;

        const result =
            await supplierservices.loginSupplier({
                businessEmail: businessEmail || Businessemail,
                password
            });

        return res.status(200).json({
            success: true,
            token: result.token,
            supplier: {
                id: result.supplier._id,
                companyName: result.supplier.companyName,
                ownerName: result.supplier.ownerName,
                businessEmail: result.supplier.businessEmail,
                phoneNumber: result.supplier.phoneNumber,
                city: result.supplier.city,
                state: result.supplier.state,
                productionCapacity: result.supplier.productionCapacity,
                gstNumber: result.supplier.gstNumber,
                createdAt: result.supplier.createdAt
            }
        });

    } catch (error) {
        if (error.code === "INVALID_CREDENTIALS") {
            return res.status(401).json({ success: false, message: error.message });
        }
        if (error.code === "SUPPLIER_NOT_APPROVED") {
            return res.status(403).json({ success: false, message: error.message });
        }

        console.error("Supplier login failed", error.code || error.name || "UnknownError");
        return res.status(500).json({ success: false, message: "Unable to log in. Please try again." });
    }
};


module.exports = {
    registerSupplier,
    getSupplierSupportContact,
    loginSupplier,
    getSupplierDashboard,
    getSupplierOrders,
    getSupplierOrderById,
    updateSupplierOrderStatus,
    generateDeliveryOtpForOrder,
    verifyDeliveryOtpForOrder,
    initiateSupplierPayoutForOrder,
    getPendingSuppliers,
    approveSupplier,
    rejectSupplier,
};

async function updateSupplierProfile(req, res) {
    try {
        const fields = ["companyName", "ownerName", "businessEmail", "phoneNumber", "city", "state", "productionCapacity", "gstNumber"];
        const profileData = Object.fromEntries(fields.map((field) => [field, req.body?.[field]]));
        const missingField = fields.find((field) => profileData[field] === undefined || String(profileData[field]).trim() === "");

        if (missingField) {
            return res.status(400).json({ success: false, message: `${missingField} is required` });
        }
        if (!/^\S+@\S+\.\S+$/.test(String(profileData.businessEmail).trim())) {
            return res.status(400).json({ success: false, message: "Valid business email is required" });
        }

        const capacity = Number(profileData.productionCapacity);
        if (!Number.isInteger(capacity) || capacity < 1) {
            return res.status(400).json({ success: false, message: "Production capacity must be a positive whole number" });
        }

        const supplier = await supplierservices.updateSupplierProfile({
            supplierId: req.user.id,
            profileData: {
                companyName: String(profileData.companyName).trim(),
                ownerName: String(profileData.ownerName).trim(),
                businessEmail: String(profileData.businessEmail).trim().toLowerCase(),
                phoneNumber: String(profileData.phoneNumber).trim(),
                city: String(profileData.city).trim(),
                state: String(profileData.state).trim(),
                productionCapacity: capacity,
                gstNumber: String(profileData.gstNumber).trim().toUpperCase(),
            },
        });

        return res.status(200).json({
            success: true,
            supplier: {
                id: supplier._id,
                companyName: supplier.companyName,
                ownerName: supplier.ownerName,
                businessEmail: supplier.businessEmail,
                phoneNumber: supplier.phoneNumber,
                city: supplier.city,
                state: supplier.state,
                productionCapacity: supplier.productionCapacity,
                gstNumber: supplier.gstNumber,
                createdAt: supplier.createdAt,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({ success: false, message: duplicateField === "gstNumber" ? "GST number already registered" : "Business email already registered" });
        }
        if (error.code === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: error.message });
        if (error.name === "ValidationError") return res.status(400).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: "Unable to update supplier profile" });
    }
}

module.exports.updateSupplierProfile = updateSupplierProfile;

async function getSupplierEarnings(req, res) {
    try {
        const earnings = await supplierservices.getSupplierEarnings({
            supplierId: req.user.id,
            months: req.query.months,
        });

        return res.status(200).json({ success: true, ...earnings });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to load supplier earnings" });
    }
}

module.exports.getSupplierEarnings = getSupplierEarnings;

async function createSupportRequest(req, res) {
    try {
        const subject = String(req.body?.subject || "").trim();
        const message = String(req.body?.message || "").trim();

        if (!subject) return res.status(400).json({ success: false, message: "Subject is required" });
        if (!message) return res.status(400).json({ success: false, message: "Message is required" });
        if (subject.length > 80 || message.length > 2000) {
            return res.status(400).json({ success: false, message: "Support request is too long" });
        }

        const request = await supplierservices.createSupportRequest({
            supplierId: req.user.id,
            subject,
            message,
        });

        return res.status(201).json({
            success: true,
            message: "Support request sent successfully",
            requestId: request._id,
        });
    } catch {
        return res.status(500).json({ success: false, message: "Unable to send support request" });
    }
}

module.exports.createSupportRequest = createSupportRequest;

async function getSupplierInvoices(req, res) {
    try {
        const financialData = await supplierservices.getSupplierInvoices(req.user.id);
        return res.status(200).json({ success: true, ...financialData });
    } catch {
        return res.status(500).json({ success: false, message: "Unable to load invoices and payments" });
    }
}

async function downloadSupplierStatement(req, res) {
    try {
        const { invoices } = await supplierservices.getSupplierInvoices(req.user.id);
        const rows = [
            ["Invoice ID", "Order ID", "Date", "Amount", "Status"],
            ...invoices.map((invoice) => [
                invoice.invoiceId,
                invoice.orderId,
                new Date(invoice.date).toISOString().slice(0, 10),
                invoice.amount,
                invoice.status,
            ]),
        ];
        const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename= supplier-statement.csv");
        return res.status(200).send(csv);
    } catch {
        return res.status(500).json({ success: false, message: "Unable to download statement" });
    }
}

module.exports.getSupplierInvoices = getSupplierInvoices;
module.exports.downloadSupplierStatement = downloadSupplierStatement;