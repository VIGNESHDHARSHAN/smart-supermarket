const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      default: '1 unit',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      default: 'SELF_CHECKOUT',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'READY_FOR_PICKUP', 'DISPATCHED', 'CANCELLED'],
      default: 'COMPLETED',
    },
    customerId: {
      type: String,
      default: 'cust_1',
    },
    customerName: {
      type: String,
      default: 'Customer',
    },
    paymentMode: {
      type: String,
      default: 'Razorpay',
    },
    transactionId: {
      type: String,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    exitPassCode: {
      type: String,
      index: true,
    },
    cartWeight: {
      type: String,
      default: '0.00 kg',
    },
    items: [orderItemSchema],
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

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
