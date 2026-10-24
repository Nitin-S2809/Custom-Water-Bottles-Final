const buildHappyClientsPipeline = () => [
  {
    $match: {
      status: "delivered",
      deliveryStatus: "completed",
      deliveryOtpVerifiedAt: { $type: "date" },
      paymentStatus: { $in: ["paid", "captured"] },
      userId: { $ne: null },
    },
  },
  { $group: { _id: "$userId" } },
  { $count: "happyClients" },
];

module.exports = {
  buildHappyClientsPipeline,
};
