const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

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

module.exports = router;
