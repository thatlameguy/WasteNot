const express = require('express');
const { 
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  updateProfileImage,
  updateUserAvatar
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.route('/update-profile')
  .put(updateUserProfile);

router.route('/update-email')
  .put(updateUserEmail);

router.route('/update-password')
  .put(updateUserPassword);

router.route('/update-profile-image')
  .post(updateProfileImage);

// Avatar route
router.route('/update-avatar')
  .put(updateUserAvatar);

module.exports = router; 