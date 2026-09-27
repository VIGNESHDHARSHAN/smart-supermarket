const express = require('express');
const router = express.Router();
const StaffMember = require('../models/StaffMember');
const { generateToken } = require('../middleware/auth');

// Seed default staff members if collection is empty
const ensureDefaultStaff = async () => {
  try {
    const count = await StaffMember.countDocuments();
    if (count === 0) {
      await StaffMember.create([
        {
          id: 'MGR_001',
          name: 'Rohan Mehra',
          email: 'manager@smartmart.com',
          phone: '+91 98800 11223',
          password: 'manager123',
          role: 'MANAGER',
          designation: 'Store General Manager',
          department: 'Store Operations & Administration',
          shift: 'General (09:00 - 19:00)',
          status: 'ACTIVE',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'
        },
        {
          id: 'STF_001',
          name: 'Priya Sundaram',
          email: 'priya.cashier@smartmart.com',
          phone: '+91 98451 22334',
          password: 'staff123',
          role: 'STAFF',
          designation: 'Senior Cashier & POS Operator',
          department: 'Billing & Front Counter',
          shift: 'Morning (07:00 - 15:00)',
          status: 'ACTIVE',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face'
        },
        {
          id: 'STF_002',
          name: 'Arun Verma',
          email: 'arun.inventory@smartmart.com',
          phone: '+91 97412 88990',
          password: 'staff123',
          role: 'STAFF',
          designation: 'Inventory & Stock Supervisor',
          department: 'Warehouse & Aisles',
          shift: 'Afternoon (14:00 - 22:00)',
          status: 'ACTIVE',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'
        },
        {
          id: 'STF_003',
          name: 'Kavita Nair',
          email: 'kavita.floor@smartmart.com',
          phone: '+91 99001 44556',
          password: 'staff123',
          role: 'STAFF',
          designation: 'Floor Associate & Customer Assist',
          department: 'Customer Experience',
          shift: 'Full Day (09:00 - 18:00)',
          status: 'ACTIVE',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face'
        }
      ]);
      console.log('🌱 Seeded default store staff and managers');
    }
  } catch (err) {
    console.warn('Could not seed default staff:', err.message);
  }
};

// 1. Get all store staff members
router.get('/', async (req, res) => {
  try {
    await ensureDefaultStaff();
    const staff = await StaffMember.find().sort({ role: -1, createdAt: 1 });
    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff members:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Manager adds new store staff
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password, role, designation, department, shift, requesterRole } = req.body;

    // Strict validation: Only MANAGER or ADMIN can add staff
    if (requesterRole && !['MANAGER', 'ADMIN', 'Store Manager'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Permission denied: Only Store Manager can onboard new staff members.' });
    }

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone number are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check duplicate email/phone
    const existing = await StaffMember.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }]
    });

    if (existing) {
      return res.status(400).json({ error: 'A staff member with this email or phone number already exists.' });
    }

    const newStaffId = 'STF_' + Date.now().toString().slice(-6);

    const newStaff = await StaffMember.create({
      id: newStaffId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: (password || 'staff123').trim(),
      role: role === 'MANAGER' ? 'MANAGER' : 'STAFF',
      designation: designation ? designation.trim() : 'Store Associate',
      department: department ? department.trim() : 'Store Floor & Billing',
      shift: shift || 'Morning (07:00 - 15:00)',
      status: 'ACTIVE',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face`
    });

    res.status(201).json({
      message: 'Staff member onboarded successfully',
      staff: newStaff
    });
  } catch (err) {
    console.error('Error adding staff member:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Manager updates staff member status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, requesterRole } = req.body;

    if (requesterRole && !['MANAGER', 'ADMIN', 'Store Manager'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Permission denied: Only Store Manager can modify staff status.' });
    }

    if (!['ACTIVE', 'ON_LEAVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await StaffMember.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff status updated', staff: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Manager removes a staff member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = req.body?.requesterRole || req.query?.requesterRole || req.headers['x-requester-role'];

    if (requesterRole && !['MANAGER', 'ADMIN', 'Store Manager'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Permission denied: Only Store Manager can remove staff members.' });
    }

    const deleted = await StaffMember.findOneAndDelete({ $or: [{ id }, { _id: id }] });
    if (!deleted) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json({ message: 'Staff member removed', staff: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Staff / Manager Login Verification
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, expectedRole } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    await ensureDefaultStaff();

    const clean = identifier.trim().toLowerCase();
    const staff = await StaffMember.findOne({
      $or: [
        { email: clean },
        { phone: identifier.trim() },
        { phone: clean }
      ]
    });

    if (!staff) {
      return res.status(401).json({ error: 'No staff account found with this email/phone. Please ask your Store Manager to onboard you.' });
    }

    // Role-specific enforcement: If logging into Manager portal, must be MANAGER or ADMIN
    if (expectedRole === 'MANAGER' && staff.role !== 'MANAGER' && staff.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: This account has Working Staff permissions, not Store Manager privileges. Please log in via the Staff Portal.' });
    }

    if (password && staff.password && staff.password !== String(password).trim()) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = generateToken({
      id: staff.id,
      email: staff.email,
      role: staff.role,
      name: staff.name
    });

    res.json({
      message: 'Login successful',
      token,
      staff
    });
  } catch (err) {
    console.error('Error logging in staff:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
