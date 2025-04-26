const express = require('express');
const { 
  generateAlerts,
  getUserAlerts,
  markAlertAsRead,
  clearAllAlerts
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get user alerts
router.route('/')
  .get(getUserAlerts)
  .delete(clearAllAlerts);

// Mark alert as read
router.route('/:id/read')
  .put(markAlertAsRead);

// Generate alerts (could be protected by admin middleware)
router.route('/generate')
  .get(generateAlerts);

module.exports = router;
