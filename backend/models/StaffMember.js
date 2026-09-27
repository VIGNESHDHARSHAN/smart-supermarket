const mongoose = require('mongoose');

const staffMemberSchema = new mongoose.Schema(
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
      default: 'staff123',
    },
    role: {
      type: String,
      enum: ['STAFF', 'MANAGER', 'ADMIN'],
      default: 'STAFF',
    },
    designation: {
      type: String,
      default: 'Store Associate',
      trim: true,
    },
    department: {
      type: String,
      default: 'Store Floor & Billing',
      trim: true,
    },
    shift: {
      type: String,
      default: 'Morning (07:00 - 15:00)',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.id || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.models.StaffMember || mongoose.model('StaffMember', staffMemberSchema);
