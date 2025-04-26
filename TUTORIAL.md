# WasteNot Application Tutorial

This tutorial will guide you through building a food waste management application like WasteNot from scratch. Designed for beginners, we'll explain each component and provide step-by-step instructions.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Setting Up Your Development Environment](#setting-up-your-development-environment)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Key Functions Explained](#key-functions-explained)
6. [Deployment](#deployment)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Further Learning](#further-learning)

## Project Overview

WasteNot is a full-stack application that helps users track food items and their expiration dates. The application features:

- User authentication
- Food item management
- Freshness tracking
- Recipe suggestions
- Food waste insights

Before diving into code, let's understand our application's architecture:

- **Frontend**: React.js single-page application
- **Backend**: Node.js/Express.js REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)

## Setting Up Your Development Environment

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)
- Code editor (VS Code recommended)
- Git for version control

### Project Setup

1. Create project directories:
```bash
mkdir waste-not
cd waste-not
mkdir backend frontend
```

2. Initialize Git:
```bash
git init
```

## Backend Development

### 1. Setting Up Express Server

1. Initialize the backend:
```bash
cd backend
npm init -y
```

2. Install dependencies:
```bash
npm install express mongoose dotenv cors jsonwebtoken bcrypt express-fileupload
npm install nodemon --save-dev
```

3. Create the basic server structure:
```
backend/
├── config/
│   └── db.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── .env
├── .env.example
├── index.js
└── package.json
```

4. Create `index.js`:
```javascript
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
  origin: ['http://localhost:5173', 'https://your-production-frontend.com'],
  credentials: true
}));
app.use(express.json());

// Connect to database
connectDB();

// Routes (will add these later)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/food-items', require('./routes/foodItemRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

5. Create database connection in `config/db.js`:
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

6. Create `.env` file:
```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/wastenot
JWT_SECRET=your_jwt_secret
```

### 2. Creating Models

1. User Model (`models/userModel.js`):
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'default',
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
```

2. Food Item Model (`models/foodItemModel.js`):
```javascript
const mongoose = require('mongoose');

const foodItemSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storage: {
      type: String,
      required: true,
      enum: ['Fridge', 'Freezer', 'Pantry'],
    },
    condition: {
      type: String,
      required: true,
      enum: ['Freshly bought', 'Near expiry', 'Already opened'],
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
    shelfLife: {
      type: Number,
      required: true,
    },
    freshness: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ['active', 'consumed', 'wasted', 'deleted'],
      default: 'active',
    },
    removedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
```

3. Recipe Model (`models/recipeModel.js`):
```javascript
const mongoose = require('mongoose');

const recipeSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    ingredients: [
      {
        type: String,
        required: true,
      },
    ],
    instructions: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
```

### 3. Creating Authentication Middleware

Create `middleware/authMiddleware.js`:
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
```

### 4. Creating Controllers

1. User Controller (`controllers/userController.js`):
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };
```

2. Food Item Controller (`controllers/foodItemController.js`):
```javascript
const FoodItem = require('../models/foodItemModel');

// @desc    Get all food items for a user
// @route   GET /api/food-items
// @access  Private
const getFoodItems = async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ 
      userId: req.user._id,
      status: 'active'
    });
    
    res.json(foodItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a new food item
// @route   POST /api/food-items
// @access  Private
const addFoodItem = async (req, res) => {
  try {
    const { name, expiryDate, storage, condition, shelfLife } = req.body;

    const foodItem = await FoodItem.create({
      userId: req.user._id,
      name,
      expiryDate,
      storage,
      condition,
      shelfLife,
    });

    res.status(201).json(foodItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getFoodItems, addFoodItem };
```

### 5. Setting Up Routes

1. Auth Routes (`routes/authRoutes.js`):
```javascript
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
```

2. Food Item Routes (`routes/foodItemRoutes.js`):
```javascript
const express = require('express');
const router = express.Router();
const { getFoodItems, addFoodItem } = require('../controllers/foodItemController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getFoodItems).post(protect, addFoodItem);

module.exports = router;
```

## Frontend Development

### 1. Setting Up the React Application

1. Create a Vite React app:
```bash
cd ../frontend
npm create vite@latest dashboard -- --template react
cd dashboard
npm install
```

2. Install dependencies:
```bash
npm install react-router-dom lucide-react axios
```

3. Create a project structure:
```
frontend/dashboard/
├── src/
│   ├── assets/
│   │   ├── AddItemModal.jsx
│   │   ├── Auth.jsx
│   │   ├── FreshnessBar.jsx
│   │   ├── Login.jsx
│   │   ├── RecipeSuggestions.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Signup.jsx
│   │   └── UpcomingExpirations.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── styles/
│   ├── utils/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
└── package.json
```

### 2. Setting Up Authentication Context

Create `src/context/AuthContext.jsx`:
```jsx
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### 3. Setting Up API Utilities

Create `src/utils/api.js`:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { API_URL, api };
```

### 4. Creating Authentication Components

1. Create `src/components/Login.jsx`:
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', formData);
      
      // Set user data in context and localStorage
      login(response.data);
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      setError(
        error.response?.data?.message || 'An error occurred during login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Login to WasteNot</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="auth-links">
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

2. Create `src/components/Signup.jsx` (similar to Login component).

### 5. Creating Food Item Management Components

1. Create `src/components/AddItemModal.jsx`:
```jsx
import { useState } from 'react';
import { api } from '../utils/api';

const AddItemModal = ({ isOpen, onClose, onItemAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    storage: 'Fridge',
    condition: 'Freshly bought',
    shelfLife: 7, // Default 7 days
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/food-items', formData);
      onItemAdded(response.data);
      onClose();
      setFormData({
        name: '',
        expiryDate: '',
        storage: 'Fridge',
        condition: 'Freshly bought',
        shelfLife: 7,
      });
    } catch (error) {
      setError(
        error.response?.data?.message || 'Failed to add item'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Food Item</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Food Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="storage">Storage Location</label>
            <select
              id="storage"
              name="storage"
              value={formData.storage}
              onChange={handleChange}
              required
            >
              <option value="Fridge">Fridge</option>
              <option value="Freezer">Freezer</option>
              <option value="Pantry">Pantry</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              <option value="Freshly bought">Freshly bought</option>
              <option value="Near expiry">Near expiry</option>
              <option value="Already opened">Already opened</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="shelfLife">Shelf Life (days)</label>
            <input
              type="number"
              id="shelfLife"
              name="shelfLife"
              value={formData.shelfLife}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
```

2. Create `src/components/UpcomingExpirations.jsx` to display food items.

### 6. Setting Up the App Component

Create `src/App.jsx`:
```jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { api } from "./utils/api";

// Components
import Sidebar from "./components/Sidebar";
import UpcomingExpirations from "./components/UpcomingExpirations";
import AddItemModal from "./components/AddItemModal";
import RecipeSuggestions from "./components/RecipeSuggestions";
import Login from "./components/Login";
import Signup from "./components/Signup";

import "./App.css";

function App() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch food items from the backend
  const fetchFoodItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError("");
      
      const response = await api.get("/food-items");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
      setError("Failed to fetch food items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [user]);

  // Handle adding a new item
  const handleItemAdded = (newItem) => {
    setItems([...items, newItem]);
  };

  // Get current date
  const currentDate = new Date();

  // Calculate freshness for an item
  const calculateFreshness = (item) => {
    const expiryDate = new Date(item.expiryDate);
    const totalDays = (expiryDate - new Date(item.addedDate)) / (1000 * 60 * 60 * 24);
    const daysLeft = (expiryDate - currentDate) / (1000 * 60 * 60 * 24);
    
    let freshness = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
    
    // Adjust based on storage and condition
    if (item.storage === "Freezer") {
      freshness = Math.min(100, freshness * 1.2); // Freezer slows degradation
    } else if (item.condition === "Already opened") {
      freshness = Math.max(0, freshness * 0.8); // Opened items degrade faster
    }
    
    return Math.round(freshness);
  };

  // Dashboard content
  const DashboardContent = () => (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <UpcomingExpirations 
          items={items.map(item => ({
            ...item,
            freshness: calculateFreshness(item)
          }))} 
          loading={loading} 
          error={error} 
        />
        <RecipeSuggestions items={items} />
        <button 
          className="add-item-button" 
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Food Item
        </button>
      </div>
      
      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onItemAdded={handleItemAdded} 
      />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <DashboardContent /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
```

## Key Functions Explained

### 1. Authentication Flow

The authentication system uses JWT (JSON Web Tokens):

1. User registers or logs in by submitting credentials to the backend
2. Backend validates credentials and returns a JWT token
3. Frontend stores the token in local storage
4. The token is included in the Authorization header for subsequent API requests
5. Protected routes check for a valid token before allowing access

### 2. Freshness Calculation

The application calculates food freshness based on multiple factors:

```javascript
const calculateFreshness = (item) => {
  // Calculate days between added date and expiry date
  const expiryDate = new Date(item.expiryDate);
  const totalDays = (expiryDate - new Date(item.addedDate)) / (1000 * 60 * 60 * 24);
  
  // Calculate days remaining until expiry
  const daysLeft = (expiryDate - currentDate) / (1000 * 60 * 60 * 24);
  
  // Calculate basic freshness percentage
  let freshness = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  
  // Adjust based on storage location and condition
  if (item.storage === "Freezer") {
    freshness = Math.min(100, freshness * 1.2); // Freezer slows degradation
  } else if (item.condition === "Already opened") {
    freshness = Math.max(0, freshness * 0.8); // Opened items degrade faster
  }
  
  return Math.round(freshness);
};
```

This function:
1. Calculates the total shelf life (days between added date and expiry date)
2. Calculates days remaining until expiry
3. Converts to a percentage (0-100%)
4. Adjusts based on storage location and condition
5. Returns a rounded freshness value

### 3. Food Item Management

The application handles food items through these operations:

1. **Adding items**: Users input details (name, expiry date, storage location)
2. **Marking as consumed/wasted**: Updates item status and moves to history
3. **Deletion**: Removes items from view but keeps them in the database
4. **Restoration**: Brings back deleted or consumed/wasted items

## Deployment

### Backend Deployment (Render)

1. Create a Render account
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure environment variables
5. Deploy the backend

### Frontend Deployment (Vercel)

1. Create a Vercel account
2. Connect your GitHub repository
3. Configure build settings
4. Set environment variables for the backend API URL
5. Deploy the frontend

## Common Issues & Solutions

1. **CORS Errors**: Ensure the backend has proper CORS configuration for your frontend domain
2. **Authentication Issues**: Check that tokens are being properly saved and included in requests
3. **Database Connection Problems**: Verify your MongoDB connection string is correct
4. **Missing Dependencies**: Make sure all required packages are installed

## Further Learning

To expand this project, consider exploring:

1. **Advanced React Patterns**: Context API, custom hooks, memoization
2. **State Management Libraries**: Redux, Zustand, or Jotai
3. **Database Design**: Indexing strategies, data normalization
4. **UI/UX Improvements**: Accessibility, responsive design, animations
5. **Testing**: Jest, React Testing Library, integration tests

---

This tutorial covers the basics of building the WasteNot application. As you implement each piece, you'll gain a better understanding of full-stack development with React and Node.js. 