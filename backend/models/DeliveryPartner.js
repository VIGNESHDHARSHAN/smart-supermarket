const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      default: '1234',
    },
    vehicleType: {
      type: String,
      enum: ['Electric Scooter', 'Motorcycle', 'Bicycle', 'Van'],
      default: 'Electric Scooter',
    },
    vehicleNo: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: String,
      default: 'Morning (07:00 - 15:00)',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_DELIVERY', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    completedTrips: {
      type: Number,
      default: 0,
    },
    activeOrders: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.id || ret._id.toString();
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.models.DeliveryPartner || mongoose.model('DeliveryPartner', deliveryPartnerSchema);
