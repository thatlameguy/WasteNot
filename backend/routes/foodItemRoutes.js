// backend/routes/foodItemRoutes.js
const express = require('express');
const { 
  addFoodItem, 
  getFoodItems, 
  updateFoodItem, 
  deleteFoodItem,
  updateFoodItemStatus,
  restoreFoodItem,
  getConsumedItems,
  getWastedItems,
  getDeletedItems,
  calculateFreshness
} = require('../controllers/foodItemController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected with auth middleware
router.use(protect);

router.route('/')
  .post(addFoodItem)
  .get(getFoodItems);

router.route('/consumed')
  .get(getConsumedItems);

router.route('/wasted')
  .get(getWastedItems);

router.route('/deleted')
  .get(getDeletedItems);

router.route('/:id')
  .put(updateFoodItem)
  .delete(deleteFoodItem);

router.route('/:id/status')
  .put(updateFoodItemStatus);

router.route('/:id/restore')
  .put(restoreFoodItem);

router.route('/:id/freshness')
  .get(calculateFreshness);

module.exports = router;