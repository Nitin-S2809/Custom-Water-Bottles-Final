const express = require('express');
const fs = require('fs');
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

const uploadsDirectory = path.resolve(__dirname, 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to the AquaBrand API!');
});

app.use('/users', userRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/uploads', express.static(uploadsDirectory));
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);

module.exports = app;