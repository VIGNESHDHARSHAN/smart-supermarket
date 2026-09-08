const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// 1. CREATE NEW ORDER (Checkout / Payment Completion)
router.post('/', async (req, res) => {
  try {
    const {
      type = 'SELF_CHECKOUT',
      items = [],
      paymentMode = 'Razorpay',
      transactionId = `TXN_${Date.now()}`,
      subtotal = 0,
      discount = 0,
      deliveryFee = 0,
      tax = 0,
      grandTotal = 0,
      selfCheckoutDetails,
      customerName = 'Ananya Iyer',
      customerId = 'cust_1',
    } = req.body;

    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const exitPassCode = 'PASS-' + orderId;
    const cartWeight = selfCheckoutDetails?.cartWeight || '0.90 kg';

    const normalizedItems = items.map((item) => ({
      productId: item.id || item.productId || item._id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      unit: item.unit || '1 unit',
    }));

    // Create Order document
    const createdOrder = await Order.create({
      id: orderId,
      type,
      status: 'COMPLETED',
      customerId,
      customerName,
      paymentMode,
      transactionId,
      subtotal: Number(subtotal),
      discount: Number(discount),
      deliveryFee: Number(deliveryFee),
      tax: Number(tax),
      grandTotal: Number(grandTotal),
      exitPassCode,
      cartWeight,
      items: normalizedItems,
    });

    // Concurrently decrement stock & increment sales count in Product collection
    for (const item of normalizedItems) {
      const isObjectId = mongoose.Types.ObjectId.isValid(item.productId);
      await Product.findOneAndUpdate(
        { $or: [...(isObjectId ? [{ _id: item.productId }] : []), { id: item.productId }] },
        {
          $inc: { stock: -item.quantity, salesCount: item.quantity },
        }
      ).catch((e) => console.warn('Could not update stock for product:', item.productId, e.message));
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      order: createdOrder,
    });
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. FETCH ALL ORDERS / CUSTOMER ORDERS
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    const query = customerId ? { customerId } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. FETCH SINGLE ORDER
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const order = await Order.findOne({
      $or: [...(isObjectId ? [{ _id: id }] : []), { id }],
    });

    if (!order) {
      return res.status(404).json({ error: `Order ${id} not found` });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE ORDER STATUS (Fulfillment / Dispatch)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const updated = await Order.findOneAndUpdate(
      { $or: [...(isObjectId ? [{ _id: id }] : []), { id }] },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: `Order ${id} not found` });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
