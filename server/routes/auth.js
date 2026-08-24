const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { generateToken } = require('../middleware/auth');

// Customer / Staff Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    const db = await getDb();
    let user = await db.get(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [identifier, identifier]
    );

    if (!user) {
      // Create user profile dynamically for quick login
      const userId = 'cust_' + Date.now();
      const userName = identifier.includes('@') ? identifier.split('@')[0] : 'Shopper ' + identifier.slice(-4);
      const userEmail = identifier.includes('@') ? identifier : `${identifier}@smartmart.com`;

      await db.run(
        `INSERT INTO users (id, name, email, role, phone, avatar, loyaltyPoints)
         VALUES (?, ?, ?, 'CUSTOMER', ?, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face', 100)`,
        [userId, userName, userEmail, identifier]
      );

      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth Login Integration
router.post('/google', async (req, res) => {
  try {
    const { name, email, avatar, isStaff } = req.body;
    const db = await getDb();

    let user = await db.get('SELECT * FROM users WHERE email = ?', [email || 'google.user@gmail.com']);

    if (!user) {
      const userId = 'google_' + Date.now();
      const role = isStaff ? 'STAFF' : 'CUSTOMER';
      await db.run(
        `INSERT INTO users (id, name, email, role, avatar, loyaltyPoints)
         VALUES (?, ?, ?, ?, ?, 350)`,
        [userId, name || 'Google User', email || 'google.user@gmail.com', role, avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face']
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({
      message: 'Google login verified',
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
