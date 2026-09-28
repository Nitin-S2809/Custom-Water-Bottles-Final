const express = require("express");
const router = express.Router();
const supplierController = require("../Controller/Suppliercontroller");
const { requireRole, requireApprovedSupplier } = require("../Middleware/authMiddleware");
const authMiddleware = require("../Middleware/authMiddleware");
const { supplierDocumentUpload } = require("../Middleware/uploadMiddleware");

router.post("/signup", supplierDocumentUpload, supplierController.registerSupplier);
router.post("/register", supplierDocumentUpload, supplierController.registerSupplier);
router.post("/login", supplierController.loginSupplier);

router.get("/support-contact", authMiddleware, requireApprovedSupplier, supplierController.getSupplierSupportContact);
router.get("/dashboard", authMiddleware, requireApprovedSupplier, supplierController.getSupplierDashboard);
router.get("/orders", authMiddleware, requireApprovedSupplier, supplierController.getSupplierOrders);
router.get("/orders/:orderId", authMiddleware, requireApprovedSupplier, supplierController.getSupplierOrderById);
router.patch("/orders/:orderId/status", authMiddleware, requireApprovedSupplier, supplierController.updateSupplierOrderStatus);
router.post("/orders/:orderId/generate-delivery-otp", authMiddleware, requireApprovedSupplier, supplierController.generateDeliveryOtpForOrder);
router.post("/orders/:orderId/verify-delivery-otp", authMiddleware, requireApprovedSupplier, supplierController.verifyDeliveryOtpForOrder);
router.post("/orders/:orderId/initiate-payout", authMiddleware, requireApprovedSupplier, supplierController.initiateSupplierPayoutForOrder);
router.get("/earnings", authMiddleware, requireApprovedSupplier, supplierController.getSupplierEarnings);
router.post("/support", authMiddleware, requireApprovedSupplier, supplierController.createSupportRequest);
router.get("/invoices", authMiddleware, requireApprovedSupplier, supplierController.getSupplierInvoices);
router.get("/statement", authMiddleware, requireApprovedSupplier, supplierController.downloadSupplierStatement);
router.put("/profile", authMiddleware, requireApprovedSupplier, supplierController.updateSupplierProfile);

router.get("/admin/pending", authMiddleware, requireRole("admin"), supplierController.getPendingSuppliers);
router.patch("/admin/suppliers/:supplierId/approve", authMiddleware, requireRole("admin"), supplierController.approveSupplier);
router.patch("/admin/suppliers/:supplierId/reject", authMiddleware, requireRole("admin"), supplierController.rejectSupplier);

module.exports = router;

