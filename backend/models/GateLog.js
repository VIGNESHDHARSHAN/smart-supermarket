const mongoose = require('mongoose');

const gateLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    gateId: {
      type: String,
      default: 'SmartGate 01',
    },
    verifiedBy: {
      type: String,
      default: 'Optical Sensor',
    },
    status: {
      type: String,
      enum: ['GRANTED', 'DENIED'],
      default: 'GRANTED',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.GateLog || mongoose.model('GateLog', gateLogSchema);
