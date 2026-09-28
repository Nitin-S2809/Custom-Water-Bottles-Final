const analyticsService = require('../Services/analyticsService');

const getAdminAnalytics = async (req, res) => {
  try {
    const { range = '30d', startDate, endDate } = req.query || {};

    const analyticsData = await analyticsService.getAdminAnalytics({
      range,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      ...analyticsData,
    });
  } catch (error) {
    console.error('Analytics controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load analytics data. Please try again.',
    });
  }
};

module.exports = {
  getAdminAnalytics,
};

