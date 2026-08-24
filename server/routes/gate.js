const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// Verify Turnstile Exit Pass
router.post('/verify', async (req, res) => {
  try {
    const { passCode, gateId = 'SmartGate 01', verifiedBy = 'Optical Sensor' } = req.body;
    const db = await getDb();

    let order = await db.get(
      'SELECT * FROM orders WHERE exitPassCode = ? OR id = ?',
      [passCode, passCode?.replace('PASS-', '')]
    );

    if (!order) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid Exit Pass Code. Turnstile remaining locked.'
      });
    }

    // Log gate passage
    await db.run(
      `INSERT INTO gate_logs (orderId, gateId, verifiedBy, status)
       VALUES (?, ?, ?, 'GRANTED')`,
      [order.id, gateId, verifiedBy]
    );

    res.json({
      valid: true,
      status: 'GATE_UNLOCKED',
      gateId,
      orderId: order.id,
      customerName: order.customerName,
      cartWeight: order.cartWeight,
      grandTotal: order.grandTotal,
      message: 'Gate Pass Verified! Smart Turnstile unlocked.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
