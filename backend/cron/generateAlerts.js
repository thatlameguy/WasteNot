require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { generateAlerts } = require('../controllers/alertController');
const connectDB = require('../config/db');

// Connect to MongoDB using the existing connection function
async function run() {
  try {
    // Connect to database
    await connectDB();
    console.log('MongoDB Connected...');
    
    console.log('Starting alert generation process...');
    
    // Call the generateAlerts function (pass null for response object)
    const result = await generateAlerts(null, null);
    
    console.log('Alert generation completed!');
    if (result.alertsCreated > 0) {
      console.log(`Created ${result.alertsCreated} new alerts.`);
    } else {
      console.log('No new alerts were created.');
    }
    
    if (result.emailsSent > 0) {
      console.log(`Sent ${result.emailsSent} emails to users.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run(); 