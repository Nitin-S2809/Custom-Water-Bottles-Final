const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./DB/db');
const userRoutes = require('./Routes/userroutes');
const supplierRoutes = require('./Routes/SupplierRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const customerRoutes = require('./Routes/customerRoutes');
const orderRoutes = require('./Routes/orderroutes');
const addressRoutes = require('./Routes/addressRoutes');
connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));





// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to the AquaBrand API!');
}); 


app.use('/users' , userRoutes);
app.use('/suppliers' , supplierRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use(
  "/uploads",
  express.static("uploads")
);
app.use(
  "/api/orders",
  orderRoutes
);
app.use("/api/addresses", addressRoutes);



module.exports = app;