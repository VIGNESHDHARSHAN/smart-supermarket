const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (e) {}
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
try { require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); } catch (e) {}

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

// Health Check Endpoint with MongoDB Status
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';

  res.json({
    status: 'OK',
    server: 'SmartMart MERN REST API',
    database: `MongoDB (${dbState})`,
    time: new Date().toISOString(),
  });
});

// Serve compiled React frontend in production
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Connect Database and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🛒 Smart Supermarket Backend API running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🚀 MERN Stack Ready for CRUD operations with MongoDB`);
      console.log(`==================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });
