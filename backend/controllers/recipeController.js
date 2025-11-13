// backend/controllers/recipeController.js
const Recipe = require('../models/recipeModel');
const FoodItem = require('../models/foodItemModel');
const fetch = require('node-fetch');
const { generateRecipeSuggestionsWithGemini } = require('../utils/geminiHelper');

// @desc    Save a recipe
// @route   POST /api/recipes
// @access  Private
const saveRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, prepTime, cookTime, imageUrl, matchedIngredients } = req.body;

    const recipe = await Recipe.create({
      userId: req.user._id,
      title,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      imageUrl,
      matchedIngredients,
      savedAt: new Date()
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.user._id }).sort({ savedAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error("Error getting recipes:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
// @access  Private
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await recipe.deleteOne();
    res.json({ message: 'Recipe removed' });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recipe suggestions based on user's food items
// @route   GET /api/recipes/suggestions
// @access  Private
const getRecipeSuggestions = async (req, res) => {
  try {
    // Get the user's food items
    const foodItems = await FoodItem.find({ userId: req.user._id });
    
    if (foodItems.length === 0) {
      return res.status(200).json({ 
        message: 'Add some food items to get recipe suggestions',
        recipes: [] 
      });
    }
    
    // Calculate days until expiry for each item and sort by urgency
    const today = new Date();
    const itemsWithExpiry = foodItems.map(item => {
      const daysUntilExpiry = Math.floor((new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24));
      return {
        name: item.name,
        daysUntilExpiry,
        freshness: item.freshness || 100
      };
    }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // Sort by most urgent first
    
    // Separate items by urgency
    const expiringItems = itemsWithExpiry.filter(item => item.daysUntilExpiry <= 3).map(item => item.name);
    const allIngredients = itemsWithExpiry.map(item => item.name);
    
    // Pass prioritized ingredient list to the recipe generator
    // If there are expiring items, put them first in the list
    const prioritizedIngredients = expiringItems.length > 0 
      ? [...new Set([...expiringItems, ...allIngredients])] // Remove duplicates while keeping expiring items first
      : allIngredients;
    
    const recipes = await generateRecipeSuggestionsWithGemini(prioritizedIngredients, expiringItems);
    res.json({ recipes });
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  saveRecipe,
  getUserRecipes,
  deleteRecipe,
  getRecipeSuggestions
};