const express = require('express');
const cors = require('cors');
const { getDb } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/gate', require('./routes/gate'));
app.use('/api/payment', require('./routes/payment'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'SmartMart Express REST API',
    time: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database and Start Server
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🛒 Smart Supermarket Backend API running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
