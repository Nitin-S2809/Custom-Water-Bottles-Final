const customerService = require('../Services/customerService');

const getCustomers = async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 10 } = req.query || {};
    const result = await customerService.getAdminCustomers({ search, status, page, limit });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load customers' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const result = await customerService.getCustomerById(req.params.id);
    return res.status(200).json({ success: true, customer: result });
  } catch (error) {
    if (error.code === 'CUSTOMER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to load customer details' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const result = await customerService.createCustomer({
      username: req.body?.username,
      email: req.body?.email,
      password: req.body?.password,
    });

    return res.status(201).json({ success: true, message: 'Customer added successfully', customer: result });
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to create customer account' });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    return res.status(200).json({ success: true, message: 'Customer deleted successfully', ...result });
  } catch (error) {
    if (error.code === 'CUSTOMER_NOT_FOUND' || error.code === 'VALIDATION_ERROR') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to delete customer' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  deleteCustomer,
};
