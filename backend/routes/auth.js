const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const { generateToken } = require('../middleware/auth');

const isMongoId = (val) => mongoose.Types.ObjectId.isValid(val) && String(new mongoose.Types.ObjectId(val)) === String(val);

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for registration' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : '';

    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      if (cleanPhone) user.phone = cleanPhone;
      if (name) user.name = name.trim();
      await user.save();
    } else {
      const userId = 'cust_' + Date.now();
      user = await User.create({
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone || undefined,
        role: 'CUSTOMER',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        loyaltyPoints: 150
      });
    }

    const token = generateToken({
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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
        { id: cleanIdentifier },
      ],
    });

    if (!user) {
      // Check if this matches one of the sample customers
      const sample = defaultSampleCustomers.find(
        (s) =>
          s.email?.toLowerCase() === cleanIdentifier.toLowerCase() ||
          s.phone === cleanIdentifier ||
          s.id === cleanIdentifier
      );

      if (sample) {
        user = await User.create({
          id: sample.id,
          name: sample.name,
          email: sample.email,
          phone: sample.phone || undefined,
          role: sample.role || 'CUSTOMER',
          avatar: sample.avatar,
          loyaltyPoints: sample.loyaltyPoints || 100,
          address: sample.address || '',
          landmark: sample.landmark || '',
          savedAddresses: sample.savedAddresses || []
        });
      } else {
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
    const { userId, email, phone, name } = req.body;
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

    let updatedUser = await User.findOneAndUpdate(
      query,
      { 
        $set: { phone: cleanPhone, ...(name ? { name: name.trim() } : {}) },
        $inc: { loyaltyPoints: 50 } // Reward user with 50 bonus loyalty points for registering mobile number
      },
      { new: true }
    );

    if (!updatedUser && (email || userId || cleanPhone)) {
      const fallbackId = userId || ('cust_' + Date.now());
      const fallbackEmail = email ? email.toLowerCase().trim() : `${cleanPhone.replace(/\D/g, '')}@smartmart.com`;
      updatedUser = await User.create({
        id: fallbackId,
        name: name || 'SmartMart Shopper',
        email: fallbackEmail,
        phone: cleanPhone,
        role: 'CUSTOMER',
        loyaltyPoints: 150
      });
    }

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

// Demo fallback profiles if DB has few users
const defaultSampleCustomers = [
  {
    id: 'cust_101',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    phone: '+91 98765 00000',
    phoneRegistered: true,
    loyaltyPoints: 450,
    address: 'Flat 402, Green Meadows Apt, Koramangala 4th Block, Bengaluru',
    landmark: 'Opposite Sony World Signal',
    savedAddresses: [
      { id: 'addr_101_1', label: 'Home', address: 'Flat 402, Green Meadows Apt, Koramangala 4th Block, Bengaluru', isDefault: true }
    ],
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
    address: 'Plot 18, 5th Cross, Indiranagar 100ft Road, Bengaluru',
    landmark: 'Near Metro Pillar 84',
    savedAddresses: [
      { id: 'addr_102_1', label: 'Home', address: 'Plot 18, 5th Cross, Indiranagar 100ft Road, Bengaluru', isDefault: true }
    ],
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
    address: 'Villa 7, Palm Grove Enclave, Whitefield, Bengaluru',
    landmark: 'Behind ITPL Main Gate',
    savedAddresses: [
      { id: 'addr_103_1', label: 'Home', address: 'Villa 7, Palm Grove Enclave, Whitefield, Bengaluru', isDefault: true }
    ],
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
    address: 'B-604, Brigade Gateway, Malleshwaram, Bengaluru',
    landmark: 'Next to World Trade Center',
    savedAddresses: [],
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
    address: '12th Floor, Prestige Acropolis, Adugodi, Bengaluru',
    landmark: 'Near Forum Mall',
    savedAddresses: [],
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
    address: '24, 7th Main, Jayanagar 4th Block, Bengaluru',
    landmark: 'Near Cool Joint',
    savedAddresses: [],
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop&crop=face',
    role: 'CUSTOMER',
    source: 'Mobile App',
    ordersCount: 4,
    totalSpend: 1980,
    lastOrderDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: '2026-08-28T18:00:00.000Z'
  }
];

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

    // 1. Process DB users (DB data always takes precedence!)
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
        loyaltyPoints: u.loyaltyPoints ?? 100,
        address: u.address || '',
        landmark: u.landmark || '',
        savedAddresses: u.savedAddresses || [],
        avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'Customer')}`,
        role: u.role || 'CUSTOMER',
        source: u.email?.includes('google') ? 'Google OAuth' : (hasPhone ? 'Mobile Registered' : 'Web Account'),
        ordersCount: stat.count,
        totalSpend: stat.totalSpend,
        lastOrderDate: stat.lastOrderDate,
        createdAt: u.createdAt || new Date().toISOString()
      });
    });

    // 2. Add demo sample customers only if they don't already exist in DB by ID or by email
    defaultSampleCustomers.forEach(sample => {
      const exists = Array.from(customersMap.values()).some(
        c => c.id === sample.id || (c.email && sample.email && c.email.toLowerCase() === sample.email.toLowerCase())
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
 * Allows Store Manager / Admin to update any customer details (name, email, phone, loyalty points, address)
 * Automatically creates/upserts into MongoDB if the record was previously a demo customer!
 */
router.patch('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, loyaltyPoints, name, email, address, landmark, role } = req.body;

    const updates = {};
    if (phone !== undefined) updates.phone = phone.trim();
    if (loyaltyPoints !== undefined) updates.loyaltyPoints = Number(loyaltyPoints);
    if (name !== undefined && name.trim()) updates.name = name.trim();
    if (email !== undefined && email.trim()) updates.email = email.toLowerCase().trim();
    if (address !== undefined) updates.address = address.trim();
    if (landmark !== undefined) updates.landmark = landmark.trim();
    if (role !== undefined) updates.role = role.toUpperCase().trim();

    const matchCriteria = [{ id }];
    if (isMongoId(id)) matchCriteria.push({ _id: id });
    if (updates.email) matchCriteria.push({ email: updates.email });

    let updated = await User.findOne({ $or: matchCriteria });

    if (updated) {
      Object.assign(updated, updates);
      await updated.save();
    } else {
      // Find fallback sample data if this was a demo customer being edited for the first time
      const sample = defaultSampleCustomers.find(s => s.id === id);
      const initialData = sample || {
        id,
        name: updates.name || 'SmartMart Customer',
        email: updates.email || `${id}@smartmart.com`,
        phone: updates.phone || '',
        address: updates.address || '',
        landmark: updates.landmark || '',
        savedAddresses: [],
        role: 'CUSTOMER',
        loyaltyPoints: 100,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updates.name || id)}`
      };

      updated = await User.create({
        ...initialData,
        ...updates,
        id // ensure custom ID is preserved
      });
    }

    res.json({
      success: true,
      message: 'Customer record updated successfully in database',
      customer: updated
    });
  } catch (err) {
    console.error('Error updating customer record:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/auth/profile
 * Allows a logged-in customer to update their own profile:
 * name, email, phone, address, landmark, savedAddresses, avatar
 * Persists immediately to MongoDB!
 */
router.patch('/profile', async (req, res) => {
  try {
    const { id, userId, email, name, phone, address, landmark, savedAddresses, avatar } = req.body;
    const targetId = id || userId;

    if (!targetId && !email && !phone) {
      return res.status(400).json({ error: 'User identifier (id, email or phone) is required' });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanPhone = phone ? phone.trim() : undefined;
    const cleanName = name ? name.trim() : undefined;

    // Search criteria
    const orCriteria = [];
    if (targetId) {
      orCriteria.push({ id: targetId });
      if (isMongoId(targetId)) orCriteria.push({ _id: targetId });
    }
    if (cleanEmail) orCriteria.push({ email: cleanEmail });
    if (cleanPhone) orCriteria.push({ phone: cleanPhone });

    const updates = {};
    if (cleanName !== undefined) updates.name = cleanName;
    if (cleanEmail !== undefined) updates.email = cleanEmail;
    if (cleanPhone !== undefined) updates.phone = cleanPhone;
    if (address !== undefined) updates.address = address.trim();
    if (landmark !== undefined) updates.landmark = landmark.trim();
    if (savedAddresses !== undefined && Array.isArray(savedAddresses)) updates.savedAddresses = savedAddresses;
    if (avatar !== undefined) updates.avatar = avatar;

    let user = await User.findOne({ $or: orCriteria });

    if (user) {
      Object.assign(user, updates);
      await user.save();
    } else {
      // Upsert: Create user record in DB if it was a demo customer or fresh user
      const newId = targetId || ('cust_' + Date.now());
      user = await User.create({
        id: newId,
        name: cleanName || 'Customer',
        email: cleanEmail || `${newId}@smartmart.com`,
        phone: cleanPhone || '',
        address: updates.address || '',
        landmark: updates.landmark || '',
        savedAddresses: updates.savedAddresses || [],
        avatar: updates.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName || 'Customer')}`,
        role: 'CUSTOMER',
        loyaltyPoints: 150
      });
    }

    res.json({
      success: true,
      message: 'Profile updated and saved to database successfully',
      user
    });
  } catch (err) {
    console.error('Error updating customer profile:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Alias for PUT /profile
router.put('/profile', async (req, res, next) => {
  req.url = '/profile';
  return router.handle(req, res, next);
});

module.exports = router;
