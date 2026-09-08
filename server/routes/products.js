const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// 1. READ ALL / SEARCH (Catalog API)
router.get('/', async (req, res) => {
  try {
    const { category, aisle, search } = req.query;
    const filter = { inStock: true };

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (aisle && aisle !== 'ALL') {
      filter.aisle = Number(aisle);
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { barcode: searchRegex },
        { productCode: searchRegex },
        { category: searchRegex },
        { brand: searchRegex },
      ];
    }

    const products = await Product.find(filter).sort({ salesCount: -1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. READ ONE BY BARCODE (Scan & Go Barcode Lookup)
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const cleanBarcode = barcode.trim();

    const product = await Product.findOne({
      $or: [{ barcode: cleanBarcode }, { productCode: cleanBarcode }, { id: cleanBarcode }],
    });

    if (!product) {
      return res.status(404).json({ error: `Barcode ${barcode} not found in catalog` });
    }

    res.json(product);
  } catch (err) {
    console.error('Error looking up barcode:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. READ ONE BY ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const product = await Product.findOne({
      $or: [...(isObjectId ? [{ _id: id }] : []), { id }, { productCode: id }],
    });

    if (!product) {
      return res.status(404).json({ error: `Product with ID ${id} not found` });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CREATE PRODUCT (Staff / Admin Catalog Addition)
router.post('/', async (req, res) => {
  try {
    const {
      barcode,
      productCode,
      name,
      category,
      price,
      mrp,
      stock,
      unit,
      aisle,
      shelf,
      image,
      brand,
    } = req.body;

    if (!barcode || !name || !price) {
      return res.status(400).json({ error: 'Barcode, name, and price are required' });
    }

    // Auto-generate ID & productCode if missing
    const generatedId = req.body.id || `PROD_${Date.now()}`;
    const generatedProductCode = productCode || `PRD${Math.floor(100 + Math.random() * 900)}`;

    const newProduct = await Product.create({
      id: generatedId,
      productCode: generatedProductCode,
      barcode,
      name,
      category: category || 'Groceries',
      price: Number(price),
      mrp: mrp ? Number(mrp) : Number(price),
      stock: stock !== undefined ? Number(stock) : 100,
      unit: unit || '1 unit',
      aisle: aisle ? Number(aisle) : 1,
      shelf: shelf ? Number(shelf) : 1,
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      brand: brand || 'SmartMart',
      inStock: true,
      rating: 4.5,
      salesCount: 0,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// 5. UPDATE PRODUCT (Stock Adjustment / Price Change)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const updateData = { ...req.body };
    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
      updateData.inStock = updateData.stock > 0;
    }
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { $or: [...(isObjectId ? [{ _id: id }] : []), { id }, { productCode: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: `Product ${id} not found` });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// 6. DELETE PRODUCT
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const deleted = await Product.findOneAndDelete({
      $or: [...(isObjectId ? [{ _id: id }] : []), { id }],
    });

    if (!deleted) {
      return res.status(404).json({ error: `Product ${id} not found` });
    }

    res.json({ message: 'Product deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
