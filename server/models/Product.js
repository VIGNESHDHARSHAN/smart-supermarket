const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true,
    },
    productCode: {
      type: String,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'SmartMart',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    mrp: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      default: 100,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 20,
    },
    unit: {
      type: String,
      default: '1 unit',
    },
    aisle: {
      type: Number,
      default: 1,
    },
    shelf: {
      type: Number,
      default: 1,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      default: 'ACTIVE',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.id || ret._id.toString();
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for fast querying & search
productSchema.index({ name: 'text', category: 'text', brand: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
