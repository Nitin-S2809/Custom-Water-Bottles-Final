const orderService = require("../Services/orderService");

const getHappyClients = async (req, res) => {
  try {
    const happyClients = await orderService.getHappyClientsCount();
    return res.status(200).json({ success: true, happyClients });
  } catch (error) {
    console.error("Public statistics error:", error);
    return res.status(500).json({ success: false, message: "Unable to load public statistics" });
  }
};

module.exports = {
  getHappyClients,
};
