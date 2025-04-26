const express = require('express');
const router = express.Router();
const { generateAlerts } = require('../controllers/alertController');

// Secured endpoint for triggering alert generation
router.post('/generate-alerts', async (req, res) => {
  try {
    // Verify secret key from request
    const { secret } = req.body;
    if (secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Invalid secret key' });
    }
    
    console.log('Running alert generation from cron job API endpoint...');
    
    // Run alert generation
    const result = await generateAlerts();
    
    return res.json({
      success: true,
      message: 'Alert generation completed',
      alertsCreated: result.alertsCreated || 0,
      emailsSent: result.emailsSent || 0
    });
  } catch (error) {
    console.error('Error in cron job API endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to generate alerts',
      message: error.message
    });
  }
});

module.exports = router; 