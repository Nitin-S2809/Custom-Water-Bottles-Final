const mongoose = require('mongoose');
const Supplier = require('../MODELS/supplier');

function connectDB() {
    mongoose.connect(process.env.DB_CONNECT).then(async () => {
        await Supplier.syncIndexes();
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });
}

module.exports = connectDB;