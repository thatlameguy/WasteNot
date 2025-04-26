/**
 * This script is used to keep the Render deployment alive by pinging the server
 * It should be run as a separate service using a service like cron-job.org or UptimeRobot
 */
const https = require('https');
const http = require('http');

// Replace with your actual Render deployment URL (without trailing slash)
const appUrl = process.env.APP_URL || 'https://your-render-app-url.onrender.com';

console.log(`Pinging ${appUrl}/ping to keep the service alive...`);

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