const express = require('express');
const { 
  saveRecipe, 
  getUserRecipes, 
  deleteRecipe, 
  getRecipeSuggestions 
} = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(saveRecipe)
  .get(getUserRecipes);

router.route('/:id')
  .delete(deleteRecipe);

router.route('/suggestions')
  .get(getRecipeSuggestions);

module.exports = router;
