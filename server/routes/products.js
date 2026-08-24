const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// Get all products / catalog search
router.get('/', async (req, res) => {
  try {
    const { category, aisle, search } = req.query;
    const db = await getDb();

    let query = 'SELECT * FROM products WHERE inStock = 1';
    let params = [];

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (aisle && aisle !== 'ALL') {
      query += ' AND aisle = ?';
      params.push(aisle);
    }

    if (search) {
      query += ' AND (name LIKE ? OR barcode LIKE ? OR category LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY salesCount DESC';

    const products = await db.all(query, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Barcode Lookup API (Scan & Go)
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const db = await getDb();

    const product = await db.get('SELECT * FROM products WHERE barcode = ? OR productCode = ?', [barcode, barcode]);

    if (!product) {
      return res.status(404).json({ error: `Barcode ${barcode} not found in catalog` });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add New Product (Staff/Admin)
router.post('/', async (req, res) => {
  try {
    const { barcode, productCode, name, category, price, mrp, stock, unit, aisle, shelf, image } = req.body;
    const db = await getDb();

    const id = 'PRD-' + Date.now();
    await db.run(
      `INSERT INTO products (id, barcode, productCode, name, category, price, mrp, stock, unit, aisle, shelf, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, barcode, productCode || id, name, category, price, mrp || price, stock || 50, unit || '1 unit', aisle || 1, shelf || 1, image]
    );

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Inventory Stock
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, price } = req.body;
    const db = await getDb();

    await db.run(
      'UPDATE products SET stock = ?, price = COALESCE(?, price) WHERE id = ?',
      [stock, price, id]
    );

    const updated = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
