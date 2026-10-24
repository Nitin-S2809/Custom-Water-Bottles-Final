const express = require("express");
const statsController = require("../Controller/statsController");

const router = express.Router();

router.get("/happy-clients", statsController.getHappyClients);

module.exports = router;
