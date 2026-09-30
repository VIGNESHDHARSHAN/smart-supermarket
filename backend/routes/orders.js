const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryPartner = require('../models/DeliveryPartner');
const User = require('../models/User');

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
      customerName = 'Customer',
      customerId = 'cust_1',
      customerPhone = '',
      deliveryAddress = '',
      deliverySpeed = 'EXPRESS',
      bypassStoreHours = false
    } = req.body;

    let finalPhone = customerPhone;
    let finalName = customerName;

    if (customerId && (!finalPhone || finalPhone.includes('00000'))) {
      try {
        const u = await User.findOne({ $or: [{ id: customerId }, { email: customerId }] });
        if (u && u.phone) finalPhone = u.phone;
        if (u && u.name) finalName = u.name;
      } catch (e) {}
    }
    if (!finalPhone) finalPhone = '+91 98765 00000';

    // Verify operating hours (default: 07:00 to 23:00)
    const enforceHours = process.env.ENFORCE_STORE_HOURS !== 'false';
    if (enforceHours && !bypassStoreHours) {
      const openHour = parseInt(process.env.STORE_OPEN_HOUR || '7', 10);
      const closeHour = parseInt(process.env.STORE_CLOSE_HOUR || '23', 10);
      const now = new Date();
      const currentHour = now.getHours();

      if (openHour < closeHour) {
        if (currentHour < openHour || currentHour >= closeHour) {
          return res.status(403).json({
            error: 'STORE_CLOSED',
            message: `Supermarket is closed for purchases. Operating hours are ${openHour}:00 to ${closeHour}:00.`
          });
        }
      }
    }

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

    // Auto-allocate delivery partner if delivery order
    let allocatedRider = null;
    let initialStatus = type === 'DELIVERY' ? 'PLACED' : (type === 'TAKEAWAY' ? 'CONFIRMED' : 'COMPLETED');

    if (type === 'DELIVERY') {
      try {
        let partner = await DeliveryPartner.findOne({ status: 'AVAILABLE' }).sort({ activeOrders: 1, completedTrips: -1 });
        if (!partner) {
          partner = await DeliveryPartner.findOne({ status: { $ne: 'OFFLINE' } }).sort({ activeOrders: 1 });
        }
        if (partner) {
          allocatedRider = {
            id: partner.id,
            name: partner.name,
            phone: partner.phone,
            rating: partner.rating || 4.9,
            bikeNo: partner.vehicleNo,
            vehicleType: partner.vehicleType || 'Electric Scooter',
            avatar: partner.avatar,
            progressPercent: 10
          };
          await DeliveryPartner.findByIdAndUpdate(partner._id, {
            status: 'ON_DELIVERY',
            $inc: { activeOrders: 1 }
          });
        }
      } catch (err) {
        console.warn('Auto-allocation warning in orders.js:', err.message);
      }
    }

    // Create Order document
    const createdOrder = await Order.create({
      id: orderId,
      type,
      status: initialStatus,
      customerId,
      customerName: finalName,
      customerPhone: finalPhone,
      deliveryAddress,
      deliverySpeed,
      paymentMode,
      transactionId,
      subtotal: Number(subtotal),
      discount: Number(discount),
      deliveryFee: Number(deliveryFee),
      tax: Number(tax),
      grandTotal: Number(grandTotal),
      exitPassCode,
      cartWeight,
      rider: allocatedRider,
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
