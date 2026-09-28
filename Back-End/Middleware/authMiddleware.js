const jwt = require("jsonwebtoken");
const Supplier = require("../MODELS/supplier");
const User = require("../MODELS/usermodel");

module.exports = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports.requireRole = (...allowedRoles) => async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const user = await User.findById(req.user.id).select("role");
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    req.user.role = user.role;
    return next();
  } catch {
    return res.status(500).json({ success: false, message: "Unable to verify account permissions" });
  }
};

module.exports.requireApprovedSupplier = async (req, res, next) => {
  if (!req.user || req.user.role !== "supplier") {
    return res.status(403).json({ success: false, message: "Supplier access is restricted to approved suppliers" });
  }

  try {
    const supplier = await Supplier.findById(req.user.id).select("approvalStatus isActive role").lean();

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier account not found" });
    }

    if (supplier.role !== "supplier" || supplier.isActive === false || supplier.approvalStatus !== "approved") {
      return res.status(403).json({ success: false, message: "Supplier account is not active or is awaiting approval" });
    }

    req.supplier = supplier;
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to verify supplier access" });
  }
};
