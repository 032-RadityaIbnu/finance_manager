const express = require('express');
const cors = require('cors');
require('dotenv').config(); //[cite: 1]

// Test koneksi database[cite: 1]
require('./config/db');

// Import Routes[cite: 1]
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();

// Middleware[cite: 1]
app.use(cors());
app.use(express.json());

// Register API Endpoints
app.use('/api/auth', authRoutes); //[cite: 1]
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget',  budgetRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'API Personal Finance Manager Running...' });
});

// Start Server[cite: 1]
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});