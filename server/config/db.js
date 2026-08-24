const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let dbInstance = null;

const getDb = async () => {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, '..', 'supermarket.db');
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDbSchema(dbInstance);
  return dbInstance;
};

const initDbSchema = async (db) => {
  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT DEFAULT 'CUSTOMER',
      phone TEXT,
      avatar TEXT,
      address TEXT,
      loyaltyPoints INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Products Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT UNIQUE NOT NULL,
      productCode TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      mrp REAL,
      stock INTEGER DEFAULT 100,
      unit TEXT,
      image TEXT,
      aisle INTEGER DEFAULT 1,
      shelf INTEGER DEFAULT 1,
      inStock INTEGER DEFAULT 1,
      rating REAL DEFAULT 4.5,
      salesCount INTEGER DEFAULT 0
    );
  `);

  // Orders Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'PLACED',
      customerId TEXT,
      customerName TEXT,
      customerPhone TEXT,
      paymentMode TEXT,
      transactionId TEXT,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      deliveryFee REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      grandTotal REAL NOT NULL,
      exitPassCode TEXT,
      cartWeight TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Order Items Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Gate Verification Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS gate_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT NOT NULL,
      gateId TEXT NOT NULL,
      verifiedBy TEXT,
      status TEXT DEFAULT 'GRANTED',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Initial Demo Products if table is empty
  const productCount = await db.get('SELECT COUNT(*) as count FROM products');
  if (productCount.count === 0) {
    const initialProducts = [
      { id: '1', barcode: '8901058000123', productCode: 'PRD-001', name: 'India Gate Basmati Rice 5kg', category: 'Grains & Rice', price: 650, mrp: 799, stock: 45, unit: '5kg', aisle: 1, shelf: 1, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80' },
      { id: '2', barcode: '8901262010012', productCode: 'PRD-002', name: 'Fortune Sunlite Sunflower Oil 1L', category: 'Oils & Ghee', price: 145, mrp: 185, stock: 60, unit: '1L', aisle: 2, shelf: 1, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80' },
      { id: '3', barcode: '8901030023456', productCode: 'PRD-003', name: 'Aashirvaad Shuddh Chakki Atta 5kg', category: 'Atta & Flours', price: 240, mrp: 280, stock: 35, unit: '5kg', aisle: 1, shelf: 2, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80' },
      { id: '4', barcode: '8901725111122', productCode: 'PRD-004', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Spices & Salt', price: 28, mrp: 30, stock: 120, unit: '1kg', aisle: 3, shelf: 1, image: 'https://images.unsplash.com/photo-1518110165385-231a473b64c0?w=500&auto=format&fit=crop&q=80' },
      { id: '5', barcode: '8901052003344', productCode: 'PRD-005', name: 'Maggi 2-Minute Noodles 12-Pack', category: 'Snacks & Instant', price: 168, mrp: 180, stock: 80, unit: '840g', aisle: 4, shelf: 1, image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80' },
      { id: '6', barcode: '8901262150099', productCode: 'PRD-006', name: 'Amul Taaza Toned Milk 500ml', category: 'Dairy & Eggs', price: 27, mrp: 27, stock: 50, unit: '500ml', aisle: 6, shelf: 1, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80' },
      { id: '7', barcode: '8901262150088', productCode: 'PRD-007', name: 'Amul Butter Pasteurised 500g', category: 'Dairy & Eggs', price: 275, mrp: 285, stock: 40, unit: '500g', aisle: 6, shelf: 2, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80' },
      { id: '8', barcode: '8901030099887', productCode: 'PRD-008', name: 'Britannia Good Day Cashew 200g', category: 'Biscuits & Bakery', price: 45, mrp: 50, stock: 95, unit: '200g', aisle: 5, shelf: 1, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80' }
    ];

    for (const p of initialProducts) {
      await db.run(
        `INSERT INTO products (id, barcode, productCode, name, category, price, mrp, stock, unit, aisle, shelf, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.barcode, p.productCode, p.name, p.category, p.price, p.mrp, p.stock, p.unit, p.aisle, p.shelf, p.image]
      );
    }
  }

  // Seed Initial Demo Customer & Staff Accounts
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const demoUsers = [
      {
        id: 'cust_1',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@gmail.com',
        role: 'CUSTOMER',
        phone: '+91 98451 23456',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
        address: 'Flat 402, Green Meadows Apt, Koramangala, Bengaluru',
        loyaltyPoints: 450
      },
      {
        id: 'staff_1',
        name: 'Dr. Rajesh Verma',
        email: 'admin@smartmart.com',
        role: 'STAFF',
        phone: '+91 98000 11223',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
        address: 'SmartMart Store Management indiranagar',
        loyaltyPoints: 999
      }
    ];

    for (const u of demoUsers) {
      await db.run(
        `INSERT INTO users (id, name, email, role, phone, avatar, address, loyaltyPoints)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, u.role, u.phone, u.avatar, u.address, u.loyaltyPoints]
      );
    }
  }
};

module.exports = { getDb };
