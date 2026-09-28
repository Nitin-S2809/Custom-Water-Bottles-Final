const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const authMiddleware = require('../Middleware/authMiddleware');
const { requireRole } = require('../Middleware/authMiddleware');
const supplierservices = require('../Services/supplierService');
const customerController = require('../Controller/customerController');
const analyticsController = require('../Controller/analyticsController');
const orderController = require('../Controller/orderController');
const User = require('../MODELS/usermodel');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

router.get('/status', async (req, res) => {
  try {
    const adminExists = await User.exists({ role: 'admin' });
    return res.status(200).json({ adminExists: Boolean(adminExists) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to check admin status' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};
    const trimmedName = String(name || '').trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (!confirmPassword || String(confirmPassword) !== String(password)) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) {
      return res.status(409).json({ success: false, message: 'An admin account already exists.' });
    }

    const existingUser = await User.findOne({ email: trimmedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An admin account already exists.' });
    }

    const admin = await User.create({
      username: trimmedName,
      email: trimmedEmail,
      password: await User.hashPassword(password),
      role: 'admin'
    });

    return res.status(201).json({
      success: true,
      message: 'Admin Created Successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An admin account already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Unable to create admin account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const admin = await User.findOne({ email: trimmedEmail, role: 'admin' }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = admin.generateAuthToken();

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to login admin' });
  }
});

router.get('/dashboard', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const stats = await supplierservices.getAdminDashboardStats();
    return res.status(200).json({ success: true, ...stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load dashboard statistics' });
  }
});

router.get('/analytics', authMiddleware, requireRole('admin'), analyticsController.getAdminAnalytics);
router.get('/orders', authMiddleware, requireRole('admin'), orderController.getAdminOrders);
router.get('/orders/stats', authMiddleware, requireRole('admin'), orderController.getAdminOrderStats);
router.get('/orders/export', authMiddleware, requireRole('admin'), orderController.exportAdminOrdersCsv);
router.get('/orders/:id', authMiddleware, requireRole('admin'), orderController.getAdminOrderById);
router.patch('/orders/:id/status', authMiddleware, requireRole('admin'), orderController.updateAdminOrderStatus);

router.get('/customers', authMiddleware, requireRole('admin'), customerController.getCustomers);
router.get('/customers/:id', authMiddleware, requireRole('admin'), customerController.getCustomerById);
router.post('/customers', authMiddleware, requireRole('admin'), customerController.createCustomer);
router.delete('/customers/:id', authMiddleware, requireRole('admin'), customerController.deleteCustomer);

router.get('/supplier-requests', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const suppliers = await supplierservices.getAdminSupplierRequests();
    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load supplier requests' });
  }
});

router.get('/suppliers', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { search, status, page, limit } = req.query || {};
    const result = await supplierservices.getAdminSuppliersList({ search, status, page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load suppliers' });
  }
});

router.get('/suppliers/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  res.set('Cache-Control', 'no-store, private');

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
  }

  try {
    const supplier = await supplierservices.getSupplierByIdForAdmin(req.params.id);
    return res.status(200).json({ success: true, supplier });
  } catch (error) {
    if (error.code === 'SUPPLIER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to load supplier details' });
  }
});

router.get('/suppliers/:id/documents/:documentType', authMiddleware, requireRole('admin'), async (req, res) => {
  res.set('Cache-Control', 'no-store, private');

  const { id, documentType } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id) || !['fssai', 'gst'].includes(documentType)) {
    return res.status(400).json({ success: false, message: 'Invalid document request' });
  }

  try {
    const documentField = documentType === 'fssai' ? 'fssaiCertificate' : 'gstCertificate';
    const supplier = await require('../MODELS/supplier')
      .findById(id)
      .select(`+${documentField}`)
      .lean();
    const storedName = supplier?.[documentField];
    if (!storedName || path.basename(storedName) !== storedName) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const privateDirectory = path.resolve(__dirname, '../private-uploads/supplier-documents');
    const filePath = path.resolve(privateDirectory, storedName);
    if (!filePath.startsWith(`${privateDirectory}${path.sep}`)) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const extension = path.extname(storedName).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    if (!contentTypes[extension]) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.setHeader('Content-Type', contentTypes[extension]);
    res.setHeader('Content-Disposition', `inline; filename="${documentType}-certificate${extension}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (res.headersSent) return res.destroy();
      return res.status(404).json({ success: false, message: 'Document not found' });
    });
    return stream.pipe(res);
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to retrieve document' });
  }
});

router.patch('/supplier-requests/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const supplier = await require('../MODELS/supplier').findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier request not found' });
    }
    if (supplier.approvalStatus !== 'pending') {
      return res.status(409).json({ success: false, message: 'Supplier request is not pending approval' });
    }

    supplier.approvalStatus = 'approved';
    supplier.isActive = true;
    supplier.role = 'supplier';
    supplier.approvedAt = new Date();
    supplier.approvedBy = req.user.id;
    supplier.payoutEnabled = true;
    supplier.payoutStatus = 'not_eligible';
    await supplier.save();

    return res.status(200).json({ success: true, supplier: { ...supplier.toObject(), id: supplier._id, status: supplier.approvalStatus } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to approve supplier request' });
  }
});

router.patch('/supplier-requests/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const supplier = await require('../MODELS/supplier').findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier request not found' });
    }
    if (supplier.approvalStatus !== 'pending') {
      return res.status(409).json({ success: false, message: 'Supplier request is not pending approval' });
    }

    supplier.approvalStatus = 'rejected';
    supplier.isActive = false;
    supplier.role = 'customer';
    supplier.rejectedAt = new Date();
    supplier.payoutEnabled = false;
    await supplier.save();

    return res.status(200).json({ success: true, supplier: { ...supplier.toObject(), id: supplier._id, status: supplier.approvalStatus } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to reject supplier request' });
  }
});

router.patch('/suppliers/:id/remove', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const supplier = await require('../MODELS/supplier').findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier.approvalStatus = 'removed';
    supplier.isActive = false;
    supplier.role = 'customer';
    supplier.removedAt = new Date();
    supplier.payoutEnabled = false;
    supplier.payoutStatus = 'not_eligible';
    await supplier.save();

    return res.status(200).json({ success: true, message: 'Supplier removed successfully', supplier: { ...supplier.toObject(), id: supplier._id, status: supplier.approvalStatus } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to remove supplier' });
  }
});

module.exports = router;
