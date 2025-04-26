require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const cron = require('node-cron');
const { generateAlerts } = require('../controllers/alertController');
const connectDB = require('../config/db');

async function startCronServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('MongoDB Connected for cron jobs...');
    
    // Schedule the generateAlerts function to run multiple times daily
    // Run at midnight (0), 8AM, noon (12PM), and 6PM (18)
    cron.schedule('0 0,8,12,18 * * *', async () => {
      console.log('Running scheduled alert generation job...');
      
      try {
        const result = await generateAlerts(null, null);
        console.log('Alert generation completed!');
        console.log(`Created ${result.alertsCreated} new alerts.`);
        console.log(`Sent ${result.emailsSent} emails to users.`);
      } catch (error) {
        console.error('Error in scheduled alert generation:', error);
      }
    });
    
    console.log('Alert generation cron jobs scheduled to run at midnight, 8AM, noon, and 6PM daily');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('Shutting down cron job server...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start cron server:', error);
    process.exit(1);
  }
}

startCronServer(); 