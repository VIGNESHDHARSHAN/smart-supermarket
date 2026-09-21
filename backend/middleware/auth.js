const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartmart_supermarket_secret_key_2026';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Optional auth fallback for demo mode
    req.user = { id: 'guest_user', role: 'CUSTOMER', name: 'Shopper Guest' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired auth token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== role && req.user.role !== 'STAFF')) {
      return res.status(403).json({ error: `Access denied. Requires ${role} role.` });
    }
    next();
  };
};

module.exports = { JWT_SECRET, generateToken, verifyToken, requireRole };
