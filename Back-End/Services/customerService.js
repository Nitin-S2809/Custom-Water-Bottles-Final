const User = require('../MODELS/usermodel');
const Order = require('../MODELS/orderModel');

const normalizeStatus = (customer = {}) => {
  const candidate = [
    customer?.status,
    customer?.accountStatus,
    customer?.membershipStatus,
    customer?.userStatus,
    customer?.state,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map((value) => String(value).trim().toLowerCase());

  const value = candidate[0] || '';

  if (customer?.isBlocked === true || customer?.isSuspended === true || candidate.some((item) => ['blocked', 'suspended', 'banned', 'locked'].includes(item))) {
    return 'blocked';
  }

  if (customer?.isActive === false || candidate.some((item) => ['inactive', 'disabled', 'deactivated', 'archived'].includes(item))) {
    return 'inactive';
  }

  if (candidate.some((item) => ['active', 'enabled', 'verified'].includes(item)) || customer?.isActive === true) {
    return 'active';
  }

  if (value) {
    return value;
  }

  return 'active';
};

const getCustomerDisplayData = (customer = {}) => ({
  id: customer._id || customer.id,
  username: customer.username || customer.name || 'N/A',
  email: customer.email || 'N/A',
  phone: customer.phone || customer.contactNumber || customer.mobile || 'N/A',
  companyName: customer.companyName || customer.company || 'N/A',
  location: customer.location || customer.address || customer.city || customer.state || 'N/A',
  createdAt: customer.createdAt || null,
  status: normalizeStatus(customer),
  isActive: customer.isActive !== false,
  role: customer.role || 'user',
});

const getSummaryCounts = (customers = []) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => normalizeStatus(customer) === 'active').length;
  const newThisMonth = customers.filter((customer) => {
    const date = customer.createdAt ? new Date(customer.createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) return false;
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const blockedCustomers = customers.filter((customer) => normalizeStatus(customer) === 'blocked').length;

  return {
    totalCustomers,
    activeCustomers,
    newThisMonth,
    blockedCustomers,
  };
};

const getCustomerStats = async () => {
  const customers = await User.find({ role: { $ne: 'admin' } }).lean();
  return getSummaryCounts(customers);
};

const getAdminCustomers = async ({ search = '', status = 'all', page = 1, limit = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));

  const baseFilter = { role: { $ne: 'admin' } };
  const searchTerm = String(search || '').trim();

  if (searchTerm) {
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    baseFilter.$or = [
      { username: regex },
      { email: regex },
      { companyName: regex },
      { phone: regex },
      { contactNumber: regex },
      { mobile: regex },
      { location: regex },
      { address: regex },
      { city: regex },
      { state: regex },
    ];
  }

  const allCustomers = await User.find(baseFilter).sort({ createdAt: -1 }).select('-password').lean();

  let filteredCustomers = allCustomers.filter((customer) => {
    if (status && status !== 'all') {
      const normalizedStatus = normalizeStatus(customer);
      if (normalizedStatus !== status) {
        return false;
      }
    }
    return true;
  });

  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / safeLimit));
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * safeLimit;
  const slicedCustomers = filteredCustomers.slice(startIndex, startIndex + safeLimit);

  const orderCounts = await Order.aggregate([
    { $match: { userId: { $in: slicedCustomers.map((customer) => customer._id) } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(orderCounts.map((item) => [String(item._id), item.count]));

  const customers = slicedCustomers.map((customer) => ({
    ...getCustomerDisplayData(customer),
    orderCount: Number(countMap[String(customer._id)] || 0),
    createdAt: customer.createdAt || null,
  }));

  return {
    customers,
    summary: getSummaryCounts(allCustomers),
    pagination: {
      currentPage,
      pageSize: safeLimit,
      totalPages,
      totalCustomers,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
};

const getCustomerById = async (id) => {
  if (!id) {
    const error = new Error('Customer id is required');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  const customer = await User.findOne({ _id: id, role: { $ne: 'admin' } }).select('-password').lean();
  if (!customer) {
    const error = new Error('Customer not found');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  const orderCount = await Order.countDocuments({ userId: customer._id });

  return {
    ...getCustomerDisplayData(customer),
    orderCount,
    createdAt: customer.createdAt || null,
  };
};

const createCustomer = async ({ username, email, password }) => {
  const trimmedName = String(username || '').trim();
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const trimmedPassword = String(password || '');

  if (!trimmedName) {
    const error = new Error('Customer name is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    const error = new Error('Valid customer email is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!trimmedPassword || trimmedPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const existingUser = await User.findOne({ email: trimmedEmail }).lean();
  if (existingUser) {
    const error = new Error('A customer with this email already exists');
    error.code = 'DUPLICATE_EMAIL';
    throw error;
  }

  const hashedPassword = await User.hashPassword(trimmedPassword);
  const customer = await User.create({
    username: trimmedName,
    email: trimmedEmail,
    password: hashedPassword,
    role: 'user',
  });

  return {
    ...getCustomerDisplayData(customer.toObject ? customer.toObject() : customer),
    orderCount: 0,
    createdAt: customer.createdAt || null,
  };
};

const deleteCustomer = async (id) => {
  if (!id) {
    const error = new Error('Customer id is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const customer = await User.findOne({ _id: id, role: { $ne: 'admin' } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  await Order.deleteMany({ userId: customer._id });
  await customer.deleteOne();

  return { success: true, deletedCustomerId: String(customer._id) };
};

module.exports = {
  getCustomerStats,
  getAdminCustomers,
  getCustomerById,
  createCustomer,
  deleteCustomer,
  normalizeStatus,
};
