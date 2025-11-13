// backend/controllers/foodItemController.js
const FoodItem = require('../models/foodItemModel');
const { calculateFreshnessWithGemini } = require('../utils/geminiHelper');
const mongoose = require('mongoose');

/**
 * Validates and sanitizes a MongoDB ObjectId from request parameters
 * @param {string} id - The ID to validate
 * @param {string} paramName - Name of the parameter (for error messages)
 * @returns {Object} - { isValid: boolean, error?: string, sanitizedId?: string }
 */
function validateObjectId(id, paramName = 'ID') {
  // Check if ID exists
  if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
    return {
      isValid: false,
      error: `${paramName} is required and cannot be empty`
    };
  }

  // Check if ID is a valid MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      isValid: false,
      error: `Invalid ${paramName} format: "${id}" is not a valid MongoDB ObjectId`
    };
  }

  return {
    isValid: true,
    sanitizedId: id.trim()
  };
}

// @desc    Add a new food item
// @route   POST /api/food-items
// @access  Private
const addFoodItem = async (req, res) => {
  try {
    console.log("Request to add food item received");
    console.log("User ID:", req.user._id);
    console.log("Request body:", req.body);
    
    const { name, expiryDate, storage, condition, shelfLife, freshness } = req.body;

    const foodItem = new FoodItem({
      userId: req.user._id,
      name,
      expiryDate,
      storage,
      condition,
      addedDate: new Date(),
      shelfLife: parseInt(shelfLife),
      freshness: parseInt(freshness || 100),
      status: 'active',
    });

    const savedItem = await foodItem.save();
    console.log("Food item saved:", savedItem);

    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all food items for a user
// @route   GET /api/food-items
// @access  Private
const getFoodItems = async (req, res) => {
  try {
    console.log("Fetching food items for user:", req.user._id);
    
    const foodItems = await FoodItem.find({ 
      userId: req.user._id,
      status: 'active'
    }).sort({ addedDate: -1 });
    
    console.log(`Found ${foodItems.length} food items for user ${req.user._id}`);
    
    res.json(foodItems);
  } catch (error) {
    console.error("Error getting food items:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a food item
// @route   PUT /api/food-items/:id
// @access  Private
const updateFoodItem = async (req, res) => {
  try {
    // Validate the ID parameter
    const idValidation = validateObjectId(req.params.id, 'Food item ID');
    if (!idValidation.isValid) {
      console.error(`❌ ${idValidation.error}`);
      return res.status(400).json({ 
        message: 'Invalid request',
        error: idValidation.error
      });
    }

    const foodItem = await FoodItem.findById(idValidation.sanitizedId);

    if (!foodItem) {
      console.error(`❌ Food item not found with ID: ${idValidation.sanitizedId}`);
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Check if the food item belongs to the user
    if (foodItem.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get the current freshness value before update if not provided in request
    if (req.body.freshness === undefined) {
      req.body.freshness = foodItem.freshness;
    }

    // Update the food item
    const updatedFoodItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedFoodItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a food item
// @route   DELETE /api/food-items/:id
// @access  Private
const deleteFoodItem = async (req, res) => {
  try {
    console.log("Delete request received for item ID:", req.params.id);
    
    if (!req.params.id) {
      console.log("No item ID provided in request");
      return res.status(400).json({ message: 'No item ID provided' });
    }

    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid item ID format:", req.params.id);
      return res.status(400).json({ message: 'Invalid item ID format' });
    }

    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      console.log("Food item not found:", req.params.id);
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Check if the food item belongs to the user
    if (foodItem.userId.toString() !== req.user._id.toString()) {
      console.log("User not authorized to delete this item. Item user:", foodItem.userId, "Request user:", req.user._id);
      return res.status(401).json({ message: 'Not authorized to delete this item' });
    }

    // Use findByIdAndDelete instead of deleteOne for better error handling
    const result = await FoodItem.findByIdAndDelete(req.params.id);
    
    if (!result) {
      console.log("Failed to delete the item:", req.params.id);
      return res.status(500).json({ message: 'Failed to delete the item' });
    }

    console.log("Item successfully deleted:", req.params.id);
    // Return 204 No Content for successful deletion without a response body
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting food item:", error);
    // Check if it's a mongoose CastError (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update food item status (consumed/wasted/deleted)
// @route   PUT /api/food-items/:id/status
// @access  Private
const updateFoodItemStatus = async (req, res) => {
  try {
    const { status, removedDate } = req.body;
    
    if (!['consumed', 'wasted', 'deleted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    // Check if the food item belongs to the user
    if (foodItem.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    foodItem.status = status;
    foodItem.removedDate = removedDate || new Date();
    
    const updatedFoodItem = await foodItem.save();
    
    res.json(updatedFoodItem);
  } catch (error) {
    console.error("Error updating food item status:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Restore food item to active status
// @route   PUT /api/food-items/:id/restore
// @access  Private
const restoreFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    // Check if the food item belongs to the user
    if (foodItem.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    foodItem.status = 'active';
    foodItem.removedDate = null;
    
    const updatedFoodItem = await foodItem.save();
    
    res.json(updatedFoodItem);
  } catch (error) {
    console.error("Error restoring food item:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get consumed food items for a user
// @route   GET /api/food-items/consumed
// @access  Private
const getConsumedItems = async (req, res) => {
  try {
    const consumedItems = await FoodItem.find({
      userId: req.user._id,
      status: 'consumed'
    }).sort({ removedDate: -1 });
    
    res.json(consumedItems);
  } catch (error) {
    console.error("Error getting consumed items:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get wasted food items for a user
// @route   GET /api/food-items/wasted
// @access  Private
const getWastedItems = async (req, res) => {
  try {
    const wastedItems = await FoodItem.find({
      userId: req.user._id,
      status: 'wasted'
    }).sort({ removedDate: -1 });
    
    res.json(wastedItems);
  } catch (error) {
    console.error("Error getting wasted items:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get deleted food items for a user
// @route   GET /api/food-items/deleted
// @access  Private
const getDeletedItems = async (req, res) => {
  try {
    const deletedItems = await FoodItem.find({
      userId: req.user._id,
      status: 'deleted'
    }).sort({ removedDate: -1 });
    
    res.json(deletedItems);
  } catch (error) {
    console.error("Error getting deleted items:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Calculate freshness for a food item using Gemini AI
// @route   GET /api/food-items/:id/freshness
// @access  Private
const calculateFreshness = async (req, res) => {
  try {
    // Extract and validate the ID parameter
    const idValidation = validateObjectId(req.params.id, 'Food item ID');
    if (!idValidation.isValid) {
      console.error(`❌ ${idValidation.error}`);
      return res.status(400).json({ 
        message: 'Invalid request',
        error: idValidation.error
      });
    }

    const id = idValidation.sanitizedId;

    // Log the request for debugging
    console.log(`🔍 Calculating freshness for food item ID: ${id}`);

    // Find the food item
    const foodItem = await FoodItem.findById(id);

    if (!foodItem) {
      console.error(`❌ Food item not found with ID: ${id}`);
      return res.status(404).json({ 
        message: 'Food item not found',
        error: `No food item found with ID: ${id}`
      });
    }

    // Check if user is authorized to view this food item
    if (foodItem.userId.toString() !== req.user.id) {
      console.error(`❌ Unauthorized access attempt: User ${req.user.id} tried to access food item ${id} owned by ${foodItem.userId}`);
      return res.status(403).json({ 
        message: 'Not authorized to access this food item',
        error: 'You do not have permission to access this food item'
      });
    }

    console.log(`Calculating freshness for: ${foodItem.name} (Condition: ${foodItem.condition}, Expiry: ${foodItem.expiryDate})`);

    // Calculate freshness using the Gemini utility - now with extended return values
    const freshnesResult = await calculateFreshnessWithGemini(foodItem);

    // Extract values from the calculation result
    const { freshness, needsAlert, explanation } = freshnesResult;
    
    console.log(`Gemini freshness result: ${freshness}%, needsAlert: ${needsAlert}, reason: ${explanation}`);

    // Apply additional validation rules to ensure the freshness makes sense
    let validatedFreshness = freshness;
    let validationApplied = false;
    let validatedExplanation = explanation || '';
    
    // Current date for calculations
    const today = new Date();
    const expiryDate = new Date(foodItem.expiryDate);
    
    // Calculate days until expiry (can be negative if expired)
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    console.log(`Days until expiry for ${foodItem.name}: ${daysUntilExpiry}`);
    
    // Critical combination checks
    if (daysUntilExpiry === 0 && foodItem.condition === "Near expiry" && freshness > 30) {
      validatedFreshness = 30;
      validatedExplanation = 'Near expiry item expiring today (corrected)';
      validationApplied = true;
      console.log(`Applied critical rule: Near expiry + expiring today -> max 30% (was ${freshness}%)`);
    } 
    else if (daysUntilExpiry === 0 && isDairy(foodItem.name) && freshness > 40) {
      validatedFreshness = 40;
      validatedExplanation = 'Dairy product expiring today (corrected)';
      validationApplied = true;
      console.log(`Applied critical rule: Dairy + expiring today -> max 40% (was ${freshness}%)`);
    }
    else if (daysUntilExpiry < 0 && freshness > 20) {
      validatedFreshness = 20;
      validatedExplanation = 'Expired item (corrected)';
      validationApplied = true;
      console.log(`Applied critical rule: Expired item -> max 20% (was ${freshness}%)`);
    }
    else if (daysUntilExpiry === 0 && freshness > 50) {
      validatedFreshness = 50;
      validatedExplanation = 'Item expiring today (corrected)';
      validationApplied = true;
      console.log(`Applied critical rule: Expiring today -> max 50% (was ${freshness}%)`);
    }
    else if (foodItem.condition === "Near expiry" && freshness > 60) {
      validatedFreshness = 60;
      validatedExplanation = 'Item marked as near expiry (corrected)';
      validationApplied = true;
      console.log(`Applied critical rule: Near expiry condition -> max 60% (was ${freshness}%)`);
    }
    
    if (validationApplied) {
      console.log(`🚨 Freshness value corrected from ${freshness}% to ${validatedFreshness}% for ${foodItem.name}`);
    } else {
      console.log(`✅ Freshness value looks reasonable: ${freshness}% for ${foodItem.name}`);
    }

    // Update the food item with the validated freshness
    foodItem.freshness = validatedFreshness;
    foodItem.lastFreshnessUpdate = Date.now();
    
    // Store the explanation
    foodItem.freshnessReason = validatedExplanation;
    
    await foodItem.save();

    // Check if we need to create a new alert for this item
    const needsAlertUpdated = needsAlert || validationApplied;
    if (needsAlertUpdated) {
      console.log(`Item ${foodItem.name} needs an alert based on freshness calculation`);
    }

    // Return the full freshness data to the client
    return res.status(200).json({ 
      freshness: validatedFreshness,
      needsAlert: needsAlertUpdated,
      explanation: validatedExplanation
    });
  } catch (error) {
    // Handle specific Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError' && error.path === '_id') {
      console.error('❌ CastError: Invalid ObjectId format for food item ID');
      console.error('Error details:', {
        value: error.value,
        path: error.path,
        kind: error.kind
      });
      return res.status(400).json({ 
        message: 'Invalid food item ID format',
        error: `The provided ID "${error.value}" is not a valid MongoDB ObjectId`,
        details: 'Please ensure the food item ID is a valid 24-character hexadecimal string'
      });
    }

    // Handle other Mongoose errors
    if (error.name === 'CastError') {
      console.error('❌ CastError:', error.message);
      return res.status(400).json({ 
        message: 'Invalid data format',
        error: error.message
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('❌ ValidationError:', error.message);
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message,
        details: error.errors
      });
    }

    // Handle all other errors
    console.error('❌ Error calculating freshness:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
    });

    return res.status(500).json({ 
      message: 'Server error calculating freshness',
      error: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message
    });
  }
};

// Helper function to check if a food item is dairy
const isDairy = (name) => {
  if (!name) return false;
  const dairyTerms = ["milk", "yogurt", "curd", "cheese", "cream", "butter", "dairy"];
  return dairyTerms.some(term => name.toLowerCase().includes(term));
};

// Export controllers
module.exports = {
  addFoodItem,
  getFoodItems,
  updateFoodItem,
  deleteFoodItem,
  updateFoodItemStatus,
  restoreFoodItem,
  getConsumedItems,
  getWastedItems,
  getDeletedItems,
  calculateFreshness,
};