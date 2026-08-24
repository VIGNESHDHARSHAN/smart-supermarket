const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// Place new order
router.post('/', async (req, res) => {
  try {
    const {
      type = 'SELF_CHECKOUT',
      items = [],
      paymentMode = 'Razorpay',
      transactionId = `TXN_${Date.now()}`,
      subtotal,
      discount = 0,
      deliveryFee = 0,
      tax = 0,
      grandTotal,
      selfCheckoutDetails
    } = req.body;

    const db = await getDb();
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const exitPassCode = 'PASS-' + orderId;
    const cartWeight = selfCheckoutDetails?.cartWeight || '0.90 kg';

    await db.run(
      `INSERT INTO orders (id, type, status, customerId, customerName, paymentMode, transactionId, subtotal, discount, deliveryFee, tax, grandTotal, exitPassCode, cartWeight)
       VALUES (?, ?, 'COMPLETED', 'cust_1', 'Ananya Iyer', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, type, paymentMode, transactionId, subtotal, discount, deliveryFee, tax, grandTotal, exitPassCode, cartWeight]
    );

    // Save order items & decrement product stock
    for (const item of items) {
      await db.run(
        `INSERT INTO order_items (orderId, productId, productName, price, quantity, unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.price, item.quantity, item.unit || '1 unit']
      );

      await db.run(
        'UPDATE products SET stock = MAX(0, stock - ?), salesCount = salesCount + ? WHERE id = ?',
        [item.quantity, item.quantity, item.id]
      );
    }

    const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    createdOrder.items = items;

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      order: createdOrder
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Customer Orders / All Orders
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');

    for (const order of orders) {
      order.items = await db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status (Fulfillment & Dispatch)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDb();

    await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
