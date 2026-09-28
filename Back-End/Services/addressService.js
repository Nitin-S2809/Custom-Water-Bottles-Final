const Address = require("../MODELS/addressModel");

const getAddressByUserId = (userId) => Address.findOne({ userId }).lean();

const createAddress = (userId, addressData) =>
  Address.create({ userId, ...addressData });

const updateAddress = (addressId, userId, addressData) =>
  Address.findOneAndUpdate({ _id: addressId, userId }, addressData, {
    new: true,
    runValidators: true,
  }).lean();

module.exports = {
  getAddressByUserId,
  createAddress,
  updateAddress,
};
