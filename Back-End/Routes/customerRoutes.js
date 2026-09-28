const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const { requireRole } = require('../Middleware/authMiddleware');
const customerController = require('../Controller/customerController');

router.get('/', authMiddleware, requireRole('admin'), customerController.getCustomers);
router.get('/:id', authMiddleware, requireRole('admin'), customerController.getCustomerById);
router.post('/', authMiddleware, requireRole('admin'), customerController.createCustomer);
router.delete('/:id', authMiddleware, requireRole('admin'), customerController.deleteCustomer);

module.exports = router;
