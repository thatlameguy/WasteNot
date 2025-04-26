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