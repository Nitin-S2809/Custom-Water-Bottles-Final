const User = require('../MODELS/usermodel');
const Order = require('../MODELS/orderModel');
const Supplier = require('../MODELS/supplier');
const Address = require('../MODELS/addressModel');

const PAID_PAYMENT_STATUSES = ['paid', 'captured'];
const DAY_MS = 24 * 60 * 60 * 1000;

const getParsedDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const formatLocalDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getDateRange = (range = '30d', customStart, customEnd) => {
  const now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);
  const rangeKey = String(range || '30d').toLowerCase().trim();

  if (rangeKey === '7d' || rangeKey === 'last_7_days') {
    start.setDate(start.getDate() - 6);
  } else if (rangeKey === '30d' || rangeKey === 'last_30_days') {
    start.setDate(start.getDate() - 29);
  } else if (rangeKey === '90d' || rangeKey === 'last_90_days') {
    start.setDate(start.getDate() - 89);
  } else if (rangeKey === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (rangeKey === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (rangeKey === 'this_year') {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (rangeKey === 'all' || rangeKey === 'all_time') {
    start = new Date(2020, 0, 1);
  } else if (rangeKey === 'custom') {
    const parsedStart = getParsedDate(customStart);
    const parsedEnd = getParsedDate(customEnd);
    if (parsedStart) start = startOfDay(parsedStart);
    if (parsedEnd) end = endOfDay(parsedEnd);
  }

  if (start > end) {
    const originalStart = start;
    start = startOfDay(end);
    end = endOfDay(originalStart);
  }

  return { start, end, rangeKey };
};

const getPreviousRange = (start, end) => {
  const currentStart = startOfDay(start);
  const currentEnd = endOfDay(end);
  const dayCount = Math.max(1, Math.round((currentEnd - currentStart) / DAY_MS) + 1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - dayCount + 1);
  return { start: startOfDay(previousStart), end: previousEnd };
};

const getPercentageDelta = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const isPaidOrder = (order) => PAID_PAYMENT_STATUSES.includes(order?.paymentStatus);

const getPaidRevenue = (orders = []) => orders.reduce((total, order) => {
  if (!isPaidOrder(order)) return total;
  const amount = Number(order?.pricing?.total || 0);
  return total + (Number.isFinite(amount) ? amount : 0);
}, 0);

const getSeriesKey = (date, monthly) => (monthly
  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  : formatLocalDate(date));

const buildTimeSeries = (orders = [], start, end) => {
  const dayCount = Math.ceil((end - start) / DAY_MS);
  const monthly = dayCount > 95;
  const revenueMap = new Map();
  const ordersMap = new Map();
  const labels = new Map();
  const cursor = monthly
    ? new Date(start.getFullYear(), start.getMonth(), 1)
    : startOfDay(start);

  while (cursor <= end) {
    const key = getSeriesKey(cursor, monthly);
    labels.set(key, monthly
      ? cursor.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      : cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    revenueMap.set(key, 0);
    ordersMap.set(key, 0);
    if (monthly) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  orders.forEach((order) => {
    const orderDate = getParsedDate(order.createdAt);
    if (!orderDate) return;
    const key = getSeriesKey(orderDate, monthly);
    if (!ordersMap.has(key)) return;

    ordersMap.set(key, ordersMap.get(key) + 1);
    if (isPaidOrder(order)) {
      const amount = Number(order?.pricing?.total || 0);
      if (Number.isFinite(amount)) revenueMap.set(key, revenueMap.get(key) + amount);
    }
  });

  const revenueSeries = Array.from(revenueMap, ([date, value]) => ({
    date,
    label: labels.get(date) || date,
    value: Number(value.toFixed(2)),
  }));
  const ordersSeries = Array.from(ordersMap, ([date, value]) => ({
    date,
    label: labels.get(date) || date,
    value,
  }));

  return { revenueSeries, ordersSeries };
};

const getLocationName = (address) => {
  if (!address) return 'Unknown / Unspecified';
  const city = String(address.city || '').trim();
  const state = String(address.state || '').trim();
  return city && state ? `${city}, ${state}` : city || state || 'Unknown / Unspecified';
};

const getAdminAnalytics = async ({ range = '30d', startDate, endDate } = {}) => {
  const dateRange = getDateRange(range, startDate, endDate);
  const previousRange = getPreviousRange(dateRange.start, dateRange.end);
  const currentMatch = { createdAt: { $gte: dateRange.start, $lte: dateRange.end } };
  const previousMatch = { createdAt: { $gte: previousRange.start, $lte: previousRange.end } };

  const [orders, previousOrders, totalCustomers, totalSuppliers, topProducts] = await Promise.all([
    Order.find(currentMatch).sort({ createdAt: -1 }).lean(),
    Order.find(previousMatch).lean(),
    User.countDocuments({ role: { $ne: 'admin' } }),
    Supplier.countDocuments({ role: 'supplier', approvalStatus: 'approved', isActive: true }),
    Order.aggregate([
      { $match: currentMatch },
      {
        $group: {
          _id: '$bottleType',
          orders: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', PAID_PAYMENT_STATUSES] },
                { $ifNull: ['$pricing.total', 0] },
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0, name: { $ifNull: ['$_id', 'Unknown'] }, orders: 1, quantity: 1, revenue: { $round: ['$revenue', 2] } } },
      { $sort: { revenue: -1, orders: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalRevenue = Number(getPaidRevenue(orders).toFixed(2));
  const previousRevenue = Number(getPaidRevenue(previousOrders).toFixed(2));
  const totalOrders = orders.length;
  const statusCounts = orders.reduce((counts, order) => {
    const status = String(order.status || 'pending').toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const statusBreakdown = Object.entries(statusCounts)
    .map(([label, value]) => ({
      label,
      value,
      percentage: totalOrders ? Number(((value / totalOrders) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.value - left.value);

  const orderUserIds = [...new Set(orders.map((order) => String(order.userId || '')).filter(Boolean))];
  const [users, addresses] = orderUserIds.length
    ? await Promise.all([
      User.find({ _id: { $in: orderUserIds } }).select('_id username email').lean(),
      Address.find({ userId: { $in: orderUserIds } }).select('userId city state').lean(),
    ])
    : [[], []];
  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const addressMap = new Map(addresses.map((address) => [String(address.userId), address]));

  const locationStats = new Map();
  orders.forEach((order) => {
    const name = getLocationName(addressMap.get(String(order.userId || '')));
    const existing = locationStats.get(name) || { count: 0, revenue: 0 };
    existing.count += 1;
    if (isPaidOrder(order)) existing.revenue += Number(order?.pricing?.total || 0) || 0;
    locationStats.set(name, existing);
  });
  const topLocations = Array.from(locationStats, ([name, stats]) => ({
    name,
    count: stats.count,
    revenue: Number(stats.revenue.toFixed(2)),
  }))
    .sort((left, right) => right.count - left.count || right.revenue - left.revenue)
    .slice(0, 10);

  const recentOrders = orders.slice(0, 10).map((order, index) => {
    const customer = userMap.get(String(order.userId || '')) || {};
    const amount = Number(order?.pricing?.total || 0);
    return {
      index: index + 1,
      id: String(order._id),
      customer: customer.username || 'Unknown Customer',
      customerName: customer.username || 'Unknown Customer',
      email: customer.email || 'N/A',
      product: order.bottleType || 'Unknown',
      bottleType: order.bottleType || 'Unknown',
      quantity: Number(order.quantity || 0),
      amount: Number.isFinite(amount) ? amount : 0,
      total: Number.isFinite(amount) ? amount : 0,
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      date: order.createdAt,
      createdAt: order.createdAt,
    };
  });

  const { revenueSeries, ordersSeries } = buildTimeSeries(orders, dateRange.start, dateRange.end);
  return {
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
      totalCustomers,
      totalSuppliers,
      approvedSuppliers: totalSuppliers,
      orderGrowth: getPercentageDelta(totalOrders, previousOrders.length),
      revenueGrowth: getPercentageDelta(totalRevenue, previousRevenue),
    },
    dateRange: { start: formatLocalDate(dateRange.start), end: formatLocalDate(dateRange.end), range: dateRange.rangeKey },
    statusBreakdown,
    topProducts,
    topLocations,
    recentOrders,
    revenueSeries,
    ordersSeries,
  };
};

module.exports = { getAdminAnalytics };
