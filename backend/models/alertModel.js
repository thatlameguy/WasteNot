// backend/models/alertModel.js
const mongoose = require('mongoose');

const alertSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'FoodItem',
    },
    itemName: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['expired', 'expiring_soon', 'low_freshness'],
    },
    daysRemaining: {
      type: Number,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEmailSent: {
      type: Boolean,
      default: false,
    },
    isCritical: {
      type: Boolean,
      default: false,
    },
    freshness: {
      type: Number,
      default: 100,
    },
    foodCategory: {
      type: String,
      enum: ['dairy', 'meat', 'produce', 'baked', 'pantry', 'other'],
      default: 'other',
    },
    alertReason: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;