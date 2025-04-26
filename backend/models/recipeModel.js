// backend/models/recipeModel.js
const mongoose = require('mongoose');

const recipeSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    ingredients: {
      type: [String],
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },
    prepTime: {
      type: String,
      default: "Not specified"
    },
    cookTime: {
      type: String,
      default: "Not specified"
    },
    imageUrl: {
      type: String,
      default: ""
    },
    matchedIngredients: {
      type: [String],
      default: []
    },
    savedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;