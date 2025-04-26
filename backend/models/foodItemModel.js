// backend/models/foodItemModel.js
const mongoose = require('mongoose');

const foodItemSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storage: {
      type: String,
      required: true,
      enum: ['Fridge', 'Freezer', 'Pantry'],
    },
    condition: {
      type: String,
      required: true,
      enum: ['Freshly bought', 'Near expiry', 'Already opened'],
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
    shelfLife: {
      type: Number,
      required: true,
    },
    freshness: {
      type: Number,
      default: 100,
    },
    freshnessReason: {
      type: String,
      default: '',
    },
    lastFreshnessUpdate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'consumed', 'wasted', 'deleted'],
      default: 'active',
    },
    removedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;