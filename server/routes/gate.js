const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const GateLog = require('../models/GateLog');

// Verify Turnstile Exit Pass
router.post('/verify', async (req, res) => {
  try {
    const { passCode, gateId = 'SmartGate 01', verifiedBy = 'Optical Sensor' } = req.body;

    if (!passCode) {
      return res.status(400).json({ valid: false, message: 'Exit pass code is required' });
    }

    const cleanPassCode = passCode.trim();
    const orderIdGuess = cleanPassCode.replace(/^PASS-/, '');

    const order = await Order.findOne({
      $or: [{ exitPassCode: cleanPassCode }, { id: orderIdGuess }, { id: cleanPassCode }],
    });

    if (!order) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid Exit Pass Code. Turnstile remaining locked.',
      });
    }

    // Log gate passage to MongoDB
    await GateLog.create({
      orderId: order.id,
      gateId,
      verifiedBy,
      status: 'GRANTED',
    });

    res.json({
      valid: true,
      status: 'GATE_UNLOCKED',
      gateId,
      orderId: order.id,
      customerName: order.customerName,
      cartWeight: order.cartWeight,
      grandTotal: order.grandTotal,
      message: 'Gate Pass Verified! Smart Turnstile unlocked.',
    });
  } catch (err) {
    console.error('Error verifying gate pass:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
