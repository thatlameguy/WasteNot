const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const initCronJobs = require('./utils/cronJobs');

// Load environment variables
dotenv.config();

// Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://waste-not-frontend.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  // Initialize cron jobs after database connection
  initCronJobs();
  console.log('Cron jobs for automated alerts initialized');
} catch (error) {
  console.error('Failed to connect to database:', error);
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
  app.use('/api/cron', require('./routes/cronRoutes'));
  console.log('All routes registered successfully');
} catch (error) {
  console.error('Error setting up routes:', error.message);
}

// Default route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Test connection endpoint
app.get('/api/test-connection', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Connection to backend API successful',
    cors: 'Enabled for waste-not-frontend.vercel.app',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});