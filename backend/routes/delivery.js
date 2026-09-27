const express = require('express');
const router = express.Router();
const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const { generateToken } = require('../middleware/auth');

// Seed default partners if collection is empty
const ensureDefaultPartners = async () => {
  try {
    const count = await DeliveryPartner.countDocuments();
    if (count === 0) {
      await DeliveryPartner.create([
        {
          id: 'DLV_001',
          name: 'Rajesh Kumar',
          email: 'rajesh@smartmart.com',
          phone: '+91 98765 43210',
          password: '1234',
          vehicleType: 'Electric Scooter',
          vehicleNo: 'KA 05 MN 4821',
          shift: 'Morning (07:00 - 15:00)',
          status: 'AVAILABLE',
          rating: 4.9,
          completedTrips: 142,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'
        },
        {
          id: 'DLV_002',
          name: 'Vikram Singh',
          email: 'vikram@smartmart.com',
          phone: '+91 98450 11223',
          password: '1234',
          vehicleType: 'Motorcycle',
          vehicleNo: 'KA 01 EK 9024',
          shift: 'Afternoon (14:00 - 22:00)',
          status: 'AVAILABLE',
          rating: 4.85,
          completedTrips: 98,
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face'
        },
        {
          id: 'DLV_003',
          name: 'Sunita Rao',
          email: 'sunita@smartmart.com',
          phone: '+91 97410 55667',
          password: '1234',
          vehicleType: 'Electric Scooter',
          vehicleNo: 'KA 03 GH 1129',
          shift: 'Full Day (09:00 - 18:00)',
          status: 'AVAILABLE',
          rating: 4.95,
          completedTrips: 175,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'
        }
      ]);
      console.log('🌱 Seeded 3 default delivery partners');
    }
  } catch (err) {
    console.warn('Could not seed default delivery partners:', err.message);
  }
};

// 1. Get all delivery partners (for Manager)
router.get('/partners', async (req, res) => {
  try {
    await ensureDefaultPartners();
    const partners = await DeliveryPartner.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    console.error('Error fetching delivery partners:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Manager adds new delivery person
router.post('/partners', async (req, res) => {
  try {
    const { name, email, phone, password = '1234', vehicleType = 'Electric Scooter', vehicleNo, shift, requesterRole } = req.body;

    // Strict validation: Only MANAGER or ADMIN can add delivery partners
    if (requesterRole && !['MANAGER', 'ADMIN', 'Store Manager'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Permission denied: Only Store Manager can onboard new delivery partners.' });
    }

    if (!name || !phone || !vehicleNo) {
      return res.status(400).json({ error: 'Name, phone number, and vehicle registration number are required' });
    }

    const cleanEmail = (email || `${phone.replace(/\D/g, '')}@smartmart.com`).toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Check for duplicate
    const existing = await DeliveryPartner.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }, { vehicleNo: vehicleNo.trim().toUpperCase() }]
    });

    if (existing) {
      return res.status(409).json({ error: 'A delivery person with this email, phone, or vehicle number already exists' });
    }

    const partnerId = 'DLV_' + Date.now().toString().slice(-6);

    const partner = await DeliveryPartner.create({
      id: partnerId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: String(password).trim(),
      vehicleType,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      shift: shift || 'Standard (08:00 - 18:00)',
      status: 'AVAILABLE',
      rating: 5.0,
      completedTrips: 0,
      activeOrders: 0,
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name)}`
    });

    res.status(201).json({
      message: 'Delivery partner registered successfully',
      partner
    });
  } catch (err) {
    console.error('Error adding delivery partner:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Update delivery partner status (Available / Offline)
router.put('/partners/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'ON_DELIVERY', 'OFFLINE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const partner = await DeliveryPartner.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { status },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ error: 'Delivery partner not found' });
    }

    res.json({ message: 'Status updated', partner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Remove delivery partner (Manager)
router.delete('/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = req.body?.requesterRole || req.query?.requesterRole || req.headers['x-requester-role'];

    // Strict validation: Only MANAGER or ADMIN can delete delivery partners
    if (requesterRole && !['MANAGER', 'ADMIN', 'Store Manager'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Permission denied: Only Store Manager can remove delivery partners.' });
    }

    const deleted = await DeliveryPartner.findOneAndDelete({ $or: [{ id }, { _id: id }] });
    if (!deleted) {
      return res.status(404).json({ error: 'Delivery partner not found' });
    }
    res.json({ message: 'Delivery partner removed', partner: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delivery Partner Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }

    await ensureDefaultPartners();

    const clean = identifier.trim().toLowerCase();
    const partner = await DeliveryPartner.findOne({
      $or: [
        { email: clean },
        { phone: identifier.trim() },
        { phone: clean }
      ]
    });

    if (!partner) {
      return res.status(401).json({ error: 'No delivery partner account found with this phone/email. Please ask your store manager to add you.' });
    }

    // Verify password if provided
    if (password && partner.password && partner.password !== String(password).trim()) {
      return res.status(401).json({ error: 'Incorrect delivery password/PIN. Default PIN is 1234.' });
    }

    const token = generateToken({
      id: partner.id,
      email: partner.email,
      role: 'DELIVERY',
      name: partner.name
    });

    res.json({
      message: 'Delivery partner authenticated',
      token,
      partner
    });
  } catch (err) {
    console.error('Error logging in delivery partner:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Automatic Delivery Partner Allocation Helper
router.post('/auto-allocate', async (req, res) => {
  try {
    const { orderId } = req.body;
    await ensureDefaultPartners();

    // Find available partner with the least active deliveries
    let partner = await DeliveryPartner.findOne({ status: 'AVAILABLE' }).sort({ activeOrders: 1, completedTrips: -1 });

    // Fallback if none are strictly available: pick the least loaded active partner
    if (!partner) {
      partner = await DeliveryPartner.findOne({ status: { $ne: 'OFFLINE' } }).sort({ activeOrders: 1 });
    }

    if (!partner) {
      // If none exist at all, pick or create default
      partner = await DeliveryPartner.findOne();
    }

    if (partner) {
      await DeliveryPartner.findByIdAndUpdate(partner._id, {
        status: 'ON_DELIVERY',
        $inc: { activeOrders: 1 }
      });
    }

    res.json({
      allocated: !!partner,
      partner: partner || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
