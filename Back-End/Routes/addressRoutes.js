const express = require("express");
const authMiddleware = require("../Middleware/authMiddleware");
const {
  getUserAddress,
  saveAddress,
  updateAddress,
} = require("../Controller/addressController");

const router = express.Router();

router.use(authMiddleware);
router.get("/:userId", (req, res, next) => {
  if (req.params.userId !== req.user.id) {
    return res.status(403).json({ message: "You can only access your own address" });
  }
  return next();
}, getUserAddress);
router.post("/", saveAddress);
router.put("/:addressId", updateAddress);

module.exports = router;
