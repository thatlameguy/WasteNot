const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Add express-fileupload only if available
try {
  const fileUpload = require('express-fileupload');
  app.use(fileUpload());
  console.log('Express-fileupload middleware loaded successfully');
} catch (error) {
  console.error('Error loading express-fileupload:', error.message);
  console.log('Continuing without file upload functionality');
}

// Connect to database
try {
  connectDB();
} catch (error) {
  console.error('Failed to connect to database:', error);
}

// Setup alert generation cron job
try {
  const cron = require('node-cron');
  const { generateAlerts } = require('./controllers/alertController');
  
  // For Render deployment - use less frequent checks to stay within free tier limits
  // Run once at midnight (0) and noon (12) to reduce resource usage
  cron.schedule('0 0,12 * * *', async () => {
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
  
  console.log('Alert generation cron jobs scheduled to run at midnight and noon daily for Render deployment');
} catch (error) {
  console.error('Error setting up cron job:', error.message);
}

// Keep Render from spinning down with a ping endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Routes
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/food-items', require('./routes/foodItemRoutes'));
  app.use('/api/recipes', require('./routes/recipeRoutes'));
  app.use('/api/alerts', require('./routes/alertRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('All routes registered successfully');
} catch (error) {
  console.error('Error setting up routes:', error.message);
}

// Default route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});