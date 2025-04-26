// API URL configuration
const getApiUrl = () => {
  // Check if we're in production
  if (window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('127.0.0.1')) {
    // Production backend URL
    return 'https://wastenot-backend-test.onrender.com/api';
  }
  
  // Local development
  return 'http://localhost:8000/api';
};

export const API_URL = getApiUrl();

// Utility for making authenticated requests
export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Handle token expiration
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return null;
      }
      
      return response;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };