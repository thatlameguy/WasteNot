const cron = require('node-cron');
const { generateAlerts } = require('../controllers/alertController');
const scheduleKeepAlive = require('../cron/keepAliveScheduler');

// Schedule tasks to be run on the server
const initCronJobs = () => {
  // Run alert generation once a day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily alert generation job...');
    try {
      const result = await generateAlerts();
      console.log('Alert generation completed:', result);
    } catch (error) {
      console.error('Error in alert generation cron job:', error);
    }
  });
  
  // Schedule keep-alive pings to prevent Render from sleeping
  scheduleKeepAlive();
  
  console.log('Cron jobs initialized');
};

module.exports = initCronJobs;
