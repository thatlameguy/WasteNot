require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const cron = require('node-cron');
const https = require('https');
const http = require('http');

// Schedule tasks to keep Render instance alive
const scheduleKeepAlive = () => {
  // Get the application URL from environment or use a default
  const appUrl = process.env.APP_URL || 'https://wastenot-backend-test.onrender.com';
  
  console.log(`Setting up keep-alive pings to ${appUrl}/ping`);
  
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    console.log(`Pinging ${appUrl}/ping at ${new Date().toISOString()}`);
    
    // Determine if we need http or https
    const requester = appUrl.startsWith('https') ? https : http;
    
    // Send the ping
    requester.get(`${appUrl}/ping`, (res) => {
      const { statusCode } = res;
      
      if (statusCode === 200) {
        console.log(`Successfully pinged server at ${new Date().toISOString()}`);
      } else {
        console.error(`Failed to ping server. Status code: ${statusCode}`);
      }
      
      // Make sure to close the connection properly
      res.resume();
    }).on('error', (err) => {
      console.error(`Error pinging server: ${err.message}`);
    });
  });
  
  console.log('Keep-alive pings scheduled every 10 minutes');
};

module.exports = scheduleKeepAlive; 