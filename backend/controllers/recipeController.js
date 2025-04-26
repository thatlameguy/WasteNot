// backend/controllers/recipeController.js
const Recipe = require('../models/recipeModel');
const FoodItem = require('../models/foodItemModel');
const fetch = require('node-fetch');

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
    
    // Extract food item names
    const ingredients = foodItems.map(item => item.name);
    
    // Implement Groq API call here (need Groq API key to be passed)
    const groqApiKey = req.headers['groq-api-key'];
    
    if (!groqApiKey) {
      return res.status(400).json({ message: 'Groq API key is required' });
    }
    
    const groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    
    const response = await fetch(groqEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful cooking assistant that specializes in recommending recipes based on available ingredients.'
          },
          {
            role: 'user',
            content: `I have the following ingredients: ${ingredients.join(', ')}. Can you suggest 5 recipes that I can make with these ingredients? For each recipe, include the title, list of ingredients, cooking instructions, preparation time, and cooking time. Format the response as JSON with the following structure: { "recipes": [{ "title": "Recipe Title", "ingredients": ["ingredient1", "ingredient2", ...], "instructions": "Step by step instructions", "prepTime": "X mins", "cookTime": "Y mins", "matchedIngredients": ["matched1", "matched2", ...] }] }`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(500).json({ message: 'Failed to get recipe suggestions' });
    }
    
    // Parse the generated recipes
    const content = data.choices[0].message.content;
    let recipes;
    
    try {
      recipes = JSON.parse(content).recipes;
    } catch (error) {
      console.error('Error parsing Groq response:', error);
      return res.status(500).json({ message: 'Failed to parse recipe suggestions' });
    }
    
    // Return the recipes
    res.json({ recipes });
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  saveRecipe,
  getUserRecipes,
  deleteRecipe,
  getRecipeSuggestions
};