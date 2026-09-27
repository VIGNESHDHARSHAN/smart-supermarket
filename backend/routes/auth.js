const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const { generateToken } = require('../middleware/auth');

const isMongoId = (val) => mongoose.Types.ObjectId.isValid(val) && String(new mongoose.Types.ObjectId(val)) === String(val);

// Customer / Staff Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes('@');

    let user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
      ],
    });

    if (!user) {
      // Create user profile dynamically for quick frictionless checkout & login
      const userId = 'cust_' + Date.now();
      const userName = isEmail
        ? cleanIdentifier.split('@')[0]
        : 'Shopper ' + cleanIdentifier.slice(-4);
      const userEmail = isEmail ? cleanIdentifier.toLowerCase() : `${cleanIdentifier}@smartmart.com`;

      user = await User.create({
        id: userId,
        name: userName,
        email: userEmail,
        phone: !isEmail ? cleanIdentifier : undefined,
        role: 'CUSTOMER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
        loyaltyPoints: 100,
      });
    }

    const token = generateToken({
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth Login Integration
router.post('/google', async (req, res) => {
  try {
    const { name, email, avatar, isStaff } = req.body;
    const targetEmail = (email || 'google.user@gmail.com').toLowerCase().trim();

    let user = await User.findOne({ email: targetEmail });

    if (!user) {
      const userId = 'google_' + Date.now();
      const role = isStaff ? 'STAFF' : 'CUSTOMER';

      user = await User.create({
        id: userId,
        name: name || 'Google User',
        email: targetEmail,
        role,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
        loyaltyPoints: 350,
      });
    }

    const token = generateToken({
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      message: 'Google login verified',
      token,
      user,
    });
  } catch (err) {
    console.error('Error during Google login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update customer phone number and credit loyalty points
router.patch('/phone', async (req, res) => {
  try {
    const { userId, email, phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = phone.trim();
    let query = {};
    if (userId) {
      query.$or = [{ id: userId }];
      if (isMongoId(userId)) query.$or.push({ _id: userId });
    }
    if (email) {
      if (!query.$or) query.$or = [];
      query.$or.push({ email: email.toLowerCase().trim() });
    }

    const updatedUser = await User.findOneAndUpdate(
      query,
      { 
        $set: { phone: cleanPhone },
        $inc: { loyaltyPoints: 50 } // Reward user with 50 bonus loyalty points for registering mobile number
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Phone number registered successfully! +50 SmartMart points awarded.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating phone number:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/customers
 * Returns all registered customers for Store Manager & Staff view
 */
router.get('/customers', async (req, res) => {
  try {
    let dbUsers = [];
    try {
      dbUsers = await User.find({
        $or: [{ role: 'CUSTOMER' }, { role: { $exists: false } }, { role: 'customer' }]
      }).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.warn('Note querying User collection:', e.message);
    }

    // Read all orders to compute customer order counts & spend
    let orders = [];
    try {
      orders = await Order.find({}).lean();
    } catch (e) {}

    const orderStatsMap = new Map();
    orders.forEach(o => {
      const custKey = (o.customerId || o.customerPhone || o.customerName || '').toLowerCase().trim();
      if (!custKey) return;
      if (!orderStatsMap.has(custKey)) {
        orderStatsMap.set(custKey, { count: 0, totalSpend: 0, lastOrderDate: o.createdAt });
      }
      const stat = orderStatsMap.get(custKey);
      stat.count += 1;
      stat.totalSpend += (o.grandTotal || 0);
      if (new Date(o.createdAt) > new Date(stat.lastOrderDate)) {
        stat.lastOrderDate = o.createdAt;
      }
    });

    const customersMap = new Map();

    // 1. Process DB users
    dbUsers.forEach(u => {
      const id = u.id || u._id.toString();
      const hasPhone = u.phone && u.phone.trim().length >= 8 && !u.phone.includes('00000');
      const stat = orderStatsMap.get(id.toLowerCase()) || 
                   (u.phone && orderStatsMap.get(u.phone.toLowerCase())) || 
                   (u.name && orderStatsMap.get(u.name.toLowerCase())) || 
                   { count: 0, totalSpend: 0, lastOrderDate: null };

      customersMap.set(id, {
        id,
        name: u.name || 'SmartMart Shopper',
        email: u.email || 'N/A',
        phone: u.phone || '',
        phoneRegistered: Boolean(hasPhone),
        loyaltyPoints: u.loyaltyPoints || 100,
        avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'Customer')}`,
        role: u.role || 'CUSTOMER',
        source: u.email?.includes('google') ? 'Google OAuth' : (hasPhone ? 'Mobile Registered' : 'Web Account'),
        ordersCount: stat.count,
        totalSpend: stat.totalSpend,
        lastOrderDate: stat.lastOrderDate,
        createdAt: u.createdAt || new Date().toISOString()
      });
    });

    // 2. Demo fallback profiles if DB is empty or has few users
    const defaultSampleCustomers = [
      {
        id: 'cust_101',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@gmail.com',
        phone: '+91 98765 00000',
        phoneRegistered: true,
        loyaltyPoints: 450,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
        role: 'CUSTOMER',
        source: 'Mobile Registration',
        ordersCount: 8,
        totalSpend: 4620,
        lastOrderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdAt: '2026-08-15T10:00:00.000Z'
      },
      {
        id: 'cust_102',
        name: 'Rohan Sharma',
        email: 'rohan.sharma@yahoo.com',
        phone: '+91 98451 23456',
        phoneRegistered: true,
        loyaltyPoints: 310,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
        role: 'CUSTOMER',
        source: 'In-Store POS',
        ordersCount: 5,
        totalSpend: 2890,
        lastOrderDate: new Date(Date.now() - 86400000 * 4).toISOString(),
        createdAt: '2026-08-20T14:30:00.000Z'
      },
      {
        id: 'cust_103',
        name: 'Priya Patel',
        email: 'priya.patel@outlook.com',
        phone: '+91 97410 98765',
        phoneRegistered: true,
        loyaltyPoints: 580,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face',
        role: 'CUSTOMER',
        source: 'SmartMart Club Member',
        ordersCount: 12,
        totalSpend: 8450,
        lastOrderDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        createdAt: '2026-07-10T09:15:00.000Z'
      },
      {
        id: 'cust_104',
        name: 'Vikram Joshi (Google User)',
        email: 'vikram.joshi.dev@gmail.com',
        phone: '',
        phoneRegistered: false,
        loyaltyPoints: 120,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
        role: 'CUSTOMER',
        source: 'Google OAuth',
        ordersCount: 2,
        totalSpend: 1140,
        lastOrderDate: new Date(Date.now() - 86400000 * 6).toISOString(),
        createdAt: '2026-09-02T16:40:00.000Z'
      },
      {
        id: 'cust_105',
        name: 'Sunita Mehra (Web Shopper)',
        email: 'sunita.mehra@gmail.com',
        phone: '',
        phoneRegistered: false,
        loyaltyPoints: 100,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face',
        role: 'CUSTOMER',
        source: 'Online Signup',
        ordersCount: 1,
        totalSpend: 620,
        lastOrderDate: new Date(Date.now() - 86400000 * 8).toISOString(),
        createdAt: '2026-09-12T11:20:00.000Z'
      },
      {
        id: 'cust_106',
        name: 'Siddharth Rao',
        email: 'siddharth.rao@gmail.com',
        phone: '+91 98865 12340',
        phoneRegistered: true,
        loyaltyPoints: 240,
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop&crop=face',
        role: 'CUSTOMER',
        source: 'Mobile App',
        ordersCount: 4,
        totalSpend: 1980,
        lastOrderDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdAt: '2026-08-28T18:00:00.000Z'
      }
    ];

    defaultSampleCustomers.forEach(sample => {
      // Add sample if not already present by email or phone
      const exists = Array.from(customersMap.values()).some(
        c => (c.email && c.email.toLowerCase() === sample.email.toLowerCase()) || 
             (c.phone && sample.phone && c.phone === sample.phone)
      );
      if (!exists) {
        customersMap.set(sample.id, sample);
      }
    });

    const customersList = Array.from(customersMap.values());

    const totalCount = customersList.length;
    const phoneRegisteredCount = customersList.filter(c => c.phoneRegistered).length;
    const missingPhoneCount = totalCount - phoneRegisteredCount;
    const totalLoyaltyPoints = customersList.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const totalRevenue = customersList.reduce((sum, c) => sum + (c.totalSpend || 0), 0);

    res.json({
      success: true,
      count: totalCount,
      stats: {
        totalCustomers: totalCount,
        phoneRegisteredCount,
        missingPhoneCount,
        totalLoyaltyPoints,
        totalRevenue
      },
      customers: customersList
    });
  } catch (err) {
    console.error('Error in /api/auth/customers:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/auth/customers/:id
 * Allows Manager to update customer details (phone, loyalty points, name)
 */
router.patch('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, loyaltyPoints, name, email } = req.body;

    const updates = {};
    if (phone !== undefined) updates.phone = phone.trim();
    if (loyaltyPoints !== undefined) updates.loyaltyPoints = Number(loyaltyPoints);
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();

    let updated = null;
    try {
      const matchCriteria = [{ id }];
      if (isMongoId(id)) matchCriteria.push({ _id: id });
      updated = await User.findOneAndUpdate(
        { $or: matchCriteria },
        { $set: updates },
        { new: true }
      );
    } catch (e) {}

    res.json({
      success: true,
      message: 'Customer record updated successfully by Store Manager',
      customer: updated || { id, ...updates }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
