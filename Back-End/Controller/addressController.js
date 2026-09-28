const mongoose = require("mongoose");
const addressService = require("../Services/addressService");

const addressFields = [
  "fullName",
  "phoneNumber",
  "email",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "pincode",
  "country",
  "addressType",
  "deliveryInstructions",
];

const getAddressData = (body) =>
  addressFields.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});

const validateAddress = (data) => {
  const requiredFields = [
    "fullName",
    "phoneNumber",
    "addressLine1",
    "city",
    "state",
    "pincode",
    "country",
    "addressType",
  ];
  return requiredFields.find((field) => !String(data[field] ?? "").trim());
};

const getUserAddress = async (req, res) => {
  const address = await addressService.getAddressByUserId(req.user.id);
  return res.status(200).json({ success: true, address: address || null });
};

const saveAddress = async (req, res) => {
  const addressData = getAddressData(req.body);
  const missingField = validateAddress(addressData);

  if (missingField) {
    return res.status(400).json({ success: false, message: `${missingField} is required` });
  }

  const existingAddress = await addressService.getAddressByUserId(req.user.id);
  const address = existingAddress
    ? await addressService.updateAddress(existingAddress._id, req.user.id, addressData)
    : await addressService.createAddress(req.user.id, addressData);

  return res.status(existingAddress ? 200 : 201).json({ success: true, address });
};

const updateAddress = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.addressId)) {
    return res.status(400).json({ success: false, message: "Invalid address ID" });
  }

  const addressData = getAddressData(req.body);
  const missingField = validateAddress(addressData);
  if (missingField) {
    return res.status(400).json({ success: false, message: `${missingField} is required` });
  }

  const address = await addressService.updateAddress(
    req.params.addressId,
    req.user.id,
    addressData
  );

  if (!address) {
    return res.status(404).json({ success: false, message: "Address not found" });
  }

  return res.status(200).json({ success: true, address });
};

module.exports = { getUserAddress, saveAddress, updateAddress };
