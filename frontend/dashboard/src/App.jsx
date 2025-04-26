"use client"

import { useState, useEffect, useRef } from "react"
import Sidebar from "./components/Sidebar"
import UpcomingExpirations from "./components/UpcomingExpirations"
import AddItem from "./components/AddItem"
import RecipeSuggestions from "./components/RecipeSuggestions"
import WastedSavedFood from "./components/WastedSavedFood"
import AddItemModal from "./components/AddItemModal"
import SavedRecipes from "./components/SavedRecipes"
import ResizableCard from "./components/ResizableCard"
import RemovedItems from "./components/RemovedItems"
import FoodInsights from "./components/FoodInsights"
import Auth from "./components/Auth"
import { useAuth } from "./context/AuthContext"
import ThemeToggle from "./components/ThemeToggle"
import "./App.css"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./components/Login"
import Signup from "./components/Signup"
import { User } from "lucide-react"
import AvatarSelector, { AVATARS } from "./components/AvatarSelector"
import FreshnessBar from "./components/FreshnessBar"
import WhitelistInstructions from "./components/WhitelistInstructions"
import "./styles/WhitelistInstructions.css"
import ResetPassword from "./components/ResetPassword"
import { Loader } from "lucide-react"
import { API_URL } from './utils/api';

function App() {
  // Get authentication state from AuthContext
  const {  logout } = useAuth();
  
  // Add this at the beginning of your App component
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  
  // Add this function to fetch food items from the backend
  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      setFetchError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      console.log("Fetching all food items categories...");
      
      // Fetch active food items
      const response = await fetch(`${API_URL}/food-items`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch food items");
      }
      
      const data = await response.json();
      console.log("Fetched active food items:", data);
      
      // Set the active items from the server
      setItems(data);
      
      // Fetch consumed items
      try {
        const consumedResponse = await fetch(`${API_URL}/food-items/consumed`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (consumedResponse.ok) {
          const consumedData = await consumedResponse.json();
          console.log("Fetched consumed items:", consumedData);
          setConsumedItems(consumedData);
        } else {
          console.error("Failed to fetch consumed items:", await consumedResponse.text());
        }
      } catch (error) {
        console.error("Error fetching consumed items:", error);
      }
      
      // Fetch wasted items
      try {
        const wastedResponse = await fetch(`${API_URL}/food-items/wasted`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (wastedResponse.ok) {
          const wastedData = await wastedResponse.json();
          console.log("Fetched wasted items:", wastedData);
          setWastedItems(wastedData);
        } else {
          console.error("Failed to fetch wasted items:", await wastedResponse.text());
        }
      } catch (error) {
        console.error("Error fetching wasted items:", error);
      }
      
      // Fetch deleted items
      try {
        const deletedResponse = await fetch(`${API_URL}/food-items/deleted`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (deletedResponse.ok) {
          const deletedData = await deletedResponse.json();
          console.log("Fetched deleted items:", deletedData);
          setDeletedItems(deletedData);
        } else {
          console.error("Failed to fetch deleted items:", await deletedResponse.text());
        }
      } catch (error) {
        console.error("Error fetching deleted items:", error);
      }
      
    } catch (error) {
      console.error("Error fetching food items:", error);
      setFetchError(error.message || "Failed to fetch food items");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/verify-token`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setUser(data.user);
          // Fetch food items after user is verified
          fetchFoodItems();
        } else {
          // If token validation fails, clear localStorage
          console.log("Token validation failed, clearing storage");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Token verification error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
      }
    };
    
    verifyToken();
  }, []);
  
  // Current date state for real-time updates
  const [currentDate, setCurrentDate] = useState(new Date())

  // Helper function to create dates relative to today
  const getRelativeDate = (daysOffset) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + daysOffset)
    return date
  }

  // Helper function to format dates in a user-friendly way
  const formatDate = (date) => {
    const now = new Date(currentDate)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (dateToCheck.getTime() === today.getTime()) {
      return 'Today'
    } else if (dateToCheck.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else if (dateToCheck.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else {
      // Calculate days difference for nearby dates
      const diffTime = dateToCheck - today
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 0 && diffDays < 7) {
        return `In ${diffDays} days`
      } else if (diffDays < 0 && diffDays > -7) {
        return `${Math.abs(diffDays)} days ago`
      } else {
        return date.toLocaleDateString()
      }
    }
  }

  const [items, setItems] = useState([
    {
      id: 1,
      name: "Milk",
      expiryDate: getRelativeDate(7), // Expires in 7 days
      storage: "Fridge",
      condition: "Freshly bought",
      addedDate: getRelativeDate(0), // Added today
      shelfLife: 7,
      freshness: 100,
    },
    {
      id: 2,
      name: "Eggs",
      expiryDate: getRelativeDate(20), // Expires in 20 days
      storage: "Fridge",
      condition: "Freshly bought",
      addedDate: getRelativeDate(-1), // Added yesterday
      shelfLife: 21,
      freshness: 95,
    },
    {
      id: 3,
      name: "Spinach",
      expiryDate: getRelativeDate(3), // Expires in 3 days
      storage: "Fridge",
      condition: "Freshly bought",
      addedDate: getRelativeDate(-2), // Added 2 days ago
      shelfLife: 5,
      freshness: 60,
    },
  ])

  // Track consumed, wasted and deleted food items
  const [consumedItems, setConsumedItems] = useState([])
  const [wastedItems, setWastedItems] = useState([])
  const [deletedItems, setDeletedItems] = useState([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [cardSizes, setCardSizes] = useState({
    upcomingExpirations: "medium",
    recipeSuggestions: "medium",
    addItem: "medium",
    wastedSaved: "medium"
  })

  // State for login/signup form toggle
  const [showLoginForm, setShowLoginForm] = useState(true);

  // Load card size preferences
  useEffect(() => {
    // Load card size preferences
    const savedCardSizes = localStorage.getItem("cardSizes")
    if (savedCardSizes) {
      setCardSizes(JSON.parse(savedCardSizes))
    }
  }, [])

  // Update current date every minute
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(dateInterval)
  }, [])

  // Update freshness values daily and set up an interval to refresh freshness
  useEffect(() => {
    // Function to calculate and update freshness
    const updateFreshness = () => {
      const today = new Date(currentDate);
      
      // Find items that need freshness recalculation (not updated within 24 hours)
      const itemsNeedingUpdate = items.filter(item => {
        if (!item.lastFreshnessUpdate) {
          return true; // No previous update, needs freshness calculation
        }
        
        const lastUpdate = new Date(item.lastFreshnessUpdate);
        const hoursSinceUpdate = Math.abs(today - lastUpdate) / 36e5; // Convert ms to hours
        return hoursSinceUpdate >= 24; // Update if last update was more than 24 hours ago
      });
      
      // If there are items needing update, call the API for each
      if (itemsNeedingUpdate.length > 0) {
        console.log(`Updating freshness for ${itemsNeedingUpdate.length} items via Groq AI`);
        
        const token = localStorage.getItem("token");
        if (!token) return;
        
        // Update each item one by one
        itemsNeedingUpdate.forEach(item => {
          fetch(`${API_URL}/food-items/${item._id}/freshness`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            // Update item with freshness from API
            setItems(prevItems => prevItems.map(prevItem => {
              if (prevItem._id === item._id) {
                return {
                  ...prevItem,
                  freshness: data.freshness,
                  freshnessReason: data.explanation || '',
                  lastFreshnessUpdate: new Date().toISOString()
                };
              }
              return prevItem;
            }));
          })
          .catch(error => {
            console.error(`Error updating freshness for ${item.name}:`, error);
          });
        });
      }
    };

    // Run freshness update when items or current date changes
    updateFreshness();
  }, [items, currentDate, setItems, API_URL]);

  // Add automatic freshness update that runs every minute
  useEffect(() => {
    console.log("Setting up automatic freshness update interval (1 minute)");
    
    // Create a function for the periodic update
    const runPeriodicFreshnessUpdate = () => {
      console.log("Running automatic freshness update...");
      // Update the current date to trigger the freshness calculation
      setCurrentDate(new Date());
    };
    
    // Set up the interval to run every minute (60000 ms)
    const intervalId = setInterval(runPeriodicFreshnessUpdate, 60000);
    
    // Clean up the interval when component unmounts
    return () => {
      console.log("Cleaning up freshness update interval");
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Helper function to get freshness color based on percentage
  const getFreshnessColor = (freshness) => {
    if (freshness > 70) return 'var(--primary-color)'
    if (freshness > 30) return 'var(--warning-color)'
    return 'var(--danger-color)'
  }

  const addItem = (newItem) => {
    setItems(prevItems => [...prevItems, newItem]);
  }

  // Handle card size change
  const handleCardSizeChange = (cardId, size) => {
    const updatedSizes = {
      ...cardSizes,
      [cardId]: size
    }
    setCardSizes(updatedSizes)
    localStorage.setItem("cardSizes", JSON.stringify(updatedSizes))
  }

  // Handle actions on items (consume, extend expiry, mark as wasted)
  const handleItemAction = (itemId, action, additionalData) => {
    switch (action) {
      case 'consumed':
        // Find the item to be consumed
        const itemToConsume = items.find(item => (item._id === itemId || item.id === itemId));
        if (itemToConsume) {
          const token = localStorage.getItem("token");
          // Update the backend
          fetch(`${API_URL}/food-items/${itemToConsume._id || itemToConsume.id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: "consumed", removedDate: new Date() })
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Failed to update item status");
            }
          })
          .then(data => {
          // Add the item to consumed items with timestamp
            setConsumedItems(prev => [...prev, {
            ...itemToConsume,
            removedDate: new Date()
          }]);
          // Remove from active items
            setItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          })
          .catch(error => {
            console.error("Error updating item status:", error);
            alert("Error updating item status. Please try again.");
          });
        }
        break;
      
      case 'extend':
        // Extend the expiry date by 1 day
        const itemToExtend = items.find(item => (item._id === itemId || item.id === itemId));
        if (itemToExtend) {
          const newExpiryDate = new Date(itemToExtend.expiryDate);
            newExpiryDate.setDate(newExpiryDate.getDate() + 1);
            
          const token = localStorage.getItem("token");
          // Update the backend
          fetch(`${API_URL}/food-items/${itemToExtend._id || itemToExtend.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ expiryDate: newExpiryDate })
          })
          .then(response => {
            if (response.ok) {
              // Update local state
              setItems(items.map(item => {
                if (item._id === itemId || item.id === itemId) {
            return {
              ...item,
              expiryDate: newExpiryDate
            };
          }
          return item;
        }));
            } else {
              alert("Failed to extend expiry date. Please try again.");
            }
          })
          .catch(error => {
            console.error("Error extending expiry date:", error);
            alert("Error extending expiry date. Please try again.");
          });
        }
        break;
      
      case 'edit-expiry':
        // Find the item to edit
        const itemToEdit = items.find(item => (item._id === itemId || item.id === itemId));
        if (itemToEdit) {
          // Get the new date from user
          const currentDate = new Date(itemToEdit.expiryDate);
          // Format as dd/mm/yyyy
          const day = String(currentDate.getDate()).padStart(2, '0');
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const year = currentDate.getFullYear();
          const formattedDate = `${day}/${month}/${year}`;
          
          const newDateStr = prompt(`Enter new expiry date for ${itemToEdit.name} (dd/mm/yyyy):`, formattedDate);
          if (newDateStr) {
            // Parse the date from dd/mm/yyyy format
            const [day, month, year] = newDateStr.split('/').map(part => parseInt(part, 10));
            const newDate = new Date(year, month - 1, day);
            
            // Check if the date is valid
            if (!isNaN(newDate.getTime())) {
              const token = localStorage.getItem("token");
              // Update the backend
              fetch(`${API_URL}/food-items/${itemToEdit._id || itemToEdit.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ expiryDate: newDate })
              })
              .then(response => {
                if (response.ok) {
              // Update the item with the new expiry date
              setItems(items.map(item => {
                    if (item._id === itemId || item.id === itemId) {
                  return {
                    ...item,
                    expiryDate: newDate
                  };
                }
                return item;
              }));
                } else {
                  alert("Failed to update expiry date. Please try again.");
                }
              })
              .catch(error => {
                console.error("Error updating expiry date:", error);
                alert("Error updating expiry date. Please try again.");
              });
            }
          }
        }
        break;
      
      case 'edit-storage':
        // Find the item to edit storage location
        const itemToChangeStorage = items.find(item => (item._id === itemId || item.id === itemId));
        if (itemToChangeStorage) {
          // Get current storage location
          const currentStorage = itemToChangeStorage.storage;
          
          // Determine available storage options excluding current one
          const storageOptions = ["Fridge", "Freezer", "Pantry"].filter(option => option !== currentStorage);
          
          // Create selection options for the user with helpful information
          let optionsText = `Select new storage location for ${itemToChangeStorage.name} (currently in ${currentStorage}):\n\n`;
          storageOptions.forEach((option, index) => {
            // Add custom information about storage impact
            let impactText = "";
            if (option === "Freezer") {
              impactText = "📈 Will extend shelf life significantly";
            } else if (option === "Fridge" && currentStorage === "Pantry") {
              impactText = "📈 Will extend shelf life moderately";
            } else if (option === "Pantry" && (currentStorage === "Fridge" || currentStorage === "Freezer")) {
              impactText = "📉 Will reduce shelf life";
            }
            
            optionsText += `${index + 1}. ${option} ${impactText ? `- ${impactText}` : ""}\n`;
          });
          
          // Get user selection
          const selection = prompt(optionsText);
          
          if (selection) {
            const selectionNum = parseInt(selection, 10);
            
            // Check if selection is valid
            if (!isNaN(selectionNum) && selectionNum >= 1 && selectionNum <= storageOptions.length) {
              const newStorage = storageOptions[selectionNum - 1];
              
              // Update item with new storage location
              setItems(items.map(item => {
                if (item._id === itemId || item.id === itemId) {
                  // Storage transfer freshness impact
                  // Moving to better storage can partly restore freshness
                  // Moving to worse storage can decrease freshness further
                  const storageImpact = {
                    // From -> To -> Freshness multiplier
                    Pantry: { Fridge: 1.1, Freezer: 1.2 },
                    Fridge: { Pantry: 0.8, Freezer: 1.15 },
                    Freezer: { Pantry: 0.7, Fridge: 0.9 }
                  };
                  
                  // Apply storage transfer impact on freshness only
                  const freshnessMultiplier = storageImpact[currentStorage]?.[newStorage] || 1.0;
                  const updatedFreshness = Math.min(100, Math.max(0, Math.round(item.freshness * freshnessMultiplier)));
                  
                  // Create updated item with new storage and freshness values
                  // but preserve the existing expiry date
                  return {
                    ...item,
                    storage: newStorage,
                    freshness: updatedFreshness
                  };
                }
                return item;
              }));
              
              // Submit updated storage to backend
              const token = localStorage.getItem("token");
              fetch(`${API_URL}/food-items/${itemId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                  storage: newStorage,
                  freshness: items.find(item => (item._id === itemId || item.id === itemId)).freshness
                })
              })
              .catch(error => {
                console.error("Error updating storage in backend:", error);
              });
              
              // Alert user about the effect of the storage change
              let messageEffect = "";
              if (newStorage === "Freezer") {
                messageEffect = "increased the freshness of";
              } else if (newStorage === "Fridge" && currentStorage === "Pantry") {
                messageEffect = "moderately increased the freshness of";
              } else if (newStorage === "Pantry" && (currentStorage === "Fridge" || currentStorage === "Freezer")) {
                messageEffect = "reduced the freshness of";
              }
              
              if (messageEffect) {
                alert(`Storage changed to ${newStorage}. This has ${messageEffect} your ${itemToChangeStorage.name} but doesn't change the expiry date.`);
              } else {
                alert(`Storage changed to ${newStorage}.`);
              }
            } else {
              alert("Invalid selection. Please enter a number from the list.");
            }
          }
        }
        break;
      
      case 'edit-condition':
        // Find the item to edit condition
        const itemToChangeCondition = items.find(item => (item._id === itemId || item.id === itemId));
        if (itemToChangeCondition) {
          // Get current condition
          const currentCondition = itemToChangeCondition.condition;
          
          // Available condition options excluding current one
          const conditionOptions = ["Freshly bought", "Near expiry", "Already opened"].filter(option => option !== currentCondition);
          
          // Create selection options for the user with helpful information
          let conditionText = `Update condition for ${itemToChangeCondition.name} (currently: ${currentCondition}):\n\n`;
          conditionOptions.forEach((option, index) => {
            // Add impact information
            let impactText = "";
            if (option === "Freshly bought" && currentCondition !== "Freshly bought") {
              impactText = "📈 Will increase freshness estimate";
            } else if (option === "Near expiry" || option === "Already opened") {
              impactText = "📉 Will reduce freshness estimate";
            }
            
            conditionText += `${index + 1}. ${option} ${impactText ? `- ${impactText}` : ""}\n`;
          });
          
          // Get user selection
          const conditionSelection = prompt(conditionText);
          
          if (conditionSelection) {
            const selectionNum = parseInt(conditionSelection, 10);
            
            // Check if selection is valid
            if (!isNaN(selectionNum) && selectionNum >= 1 && selectionNum <= conditionOptions.length) {
              const newCondition = conditionOptions[selectionNum - 1];
              
              // Condition impact factors on freshness
              const conditionFactors = {
                "Freshly bought": { freshnessMultiplier: 1.1 },
                "Near expiry": { freshnessMultiplier: 0.7 },
                "Already opened": { freshnessMultiplier: 0.5 }
              };
              
              // Update item with new condition and adjusted freshness
              setItems(items.map(item => {
                if (item.id === itemId || item._id === itemId) {
                  // Condition impact factors on freshness
                  const oldFactor = conditionFactors[currentCondition] || conditionFactors["Freshly bought"];
                  const newFactor = conditionFactors[newCondition] || conditionFactors["Freshly bought"];
                  const freshnessChange = newFactor.freshnessMultiplier / oldFactor.freshnessMultiplier;
                  const updatedFreshness = Math.min(100, Math.max(0, Math.round(item.freshness * freshnessChange)));
                  
                  // Return item with updated condition and freshness
                  // but preserve the existing expiry date
                  return {
                    ...item,
                    condition: newCondition,
                    freshness: updatedFreshness
                  };
                }
                return item;
              }));
              
              // Submit updated condition to backend
              const token = localStorage.getItem("token");
              fetch(`${API_URL}/food-items/${itemId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                  condition: newCondition,
                  freshness: items.find(item => (item._id === itemId || item.id === itemId)).freshness
                })
              })
              .catch(error => {
                console.error("Error updating condition in backend:", error);
              });
              
              // Alert user about effect of condition change
              if (newCondition === "Freshly bought") {
                alert(`Condition updated to ${newCondition}. This has improved the freshness estimate of your ${itemToChangeCondition.name} but doesn't change the expiry date.`);
              } else {
                alert(`Condition updated to ${newCondition}. This has reduced the freshness estimate of your ${itemToChangeCondition.name} but doesn't change the expiry date.`);
              }
            } else {
              alert("Invalid selection. Please enter a number from the list.");
            }
          }
        }
        break;
      
      case 'wasted':
        // Find the item to be marked as wasted
        const itemToWaste = items.find(item => (item._id === itemId || item.id === itemId));
        if (itemToWaste) {
          const token = localStorage.getItem("token");
          // Update the backend
          fetch(`${API_URL}/food-items/${itemToWaste._id || itemToWaste.id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: "wasted", removedDate: new Date() })
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Failed to update item status");
            }
          })
          .then(data => {
          // Add the item to wasted items with timestamp
            setWastedItems(prev => [...prev, {
            ...itemToWaste,
            removedDate: new Date()
          }]);
          // Remove from active items
            setItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          })
          .catch(error => {
            console.error("Error updating item status:", error);
            alert("Error updating item status. Please try again.");
          });
        }
        break;
      
      case 'update-freshness':
        // Update the freshness value of an item
        const freshness = additionalData; // The freshness value from Groq API
        
        if (typeof freshness === 'number') {
          // Update the backend to store this freshness value permanently
          const token = localStorage.getItem("token");
          const itemToUpdate = items.find(item => (item._id === itemId || item.id === itemId));
          
          if (itemToUpdate) {
            fetch(`${API_URL}/food-items/${itemToUpdate._id || itemToUpdate.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ 
                freshness,
                lastFreshnessUpdate: new Date().toISOString()
              })
            })
            .then(response => {
              if (!response.ok) {
                console.error("Failed to persist freshness value to backend");
              }
            })
            .catch(error => {
              console.error("Error updating freshness in backend:", error);
            });
          }
          
          // Update local state with freshness and lastFreshnessUpdate
          setItems(items.map(item => {
            if (item._id === itemId || item.id === itemId) {
              return {
                ...item,
                freshness,
                lastFreshnessUpdate: new Date().toISOString()
              };
            }
            return item;
          }));
        }
        break;
      
      case 'delete':
        (async () => {
          // Move item to deleted items instead of permanent deletion
          const itemToDelete = items.find(item => (item._id === itemId || item.id === itemId));
          if (itemToDelete) {
            if (window.confirm(`Are you sure you want to delete ${itemToDelete.name}?`)) {
              try {
                const token = localStorage.getItem("token");
                const itemIdToUse = itemToDelete._id || itemToDelete.id;
                console.log("Attempting to move item to deleted:", itemIdToUse);
                
                // Update item status to "deleted" in backend
                const response = await fetch(`${API_URL}/food-items/${itemIdToUse}/status`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({ status: "deleted", removedDate: new Date() })
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error("Error response when setting item to deleted:", errorText);
                  let errorMessage = "Failed to update item status";
                  
                  try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                  } catch (e) {
                    if (errorText) errorMessage = errorText;
                  }
                  
                  throw new Error(errorMessage);
                }
                
                const data = await response.json();
                console.log("Item moved to deleted successfully:", data);
                
                // Add the returned item to deleted items
                setDeletedItems(prev => [...prev, data]);
                
                // Remove from active items
                setItems(prev => prev.filter(item => 
                  (item._id !== itemId && item.id !== itemId)
                ));
                
                // Fetch all deleted items to ensure state is in sync
                const deletedResponse = await fetch(`${API_URL}/food-items/deleted`, {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                  }
                });
                
                if (deletedResponse.ok) {
                  const deletedData = await deletedResponse.json();
                  console.log("Updated deleted items:", deletedData);
                  setDeletedItems(deletedData);
                } else {
                  console.error("Error fetching updated deleted items");
                }
                
                alert(`${itemToDelete.name} has been deleted from your inventory.`);
              } catch (error) {
                console.error("Error updating item status:", error);
                alert(`Error deleting item: ${error.message}. Please try again.`);
              }
            }
          }
        })();
        break;
      
      default:
        console.log(`Unhandled action: ${action}`);
    }
  }

  // Function to restore items from consumed, wasted, or deleted lists
  const handleRestoreItem = (itemId, source) => {
    const token = localStorage.getItem("token");
    
    if (source === 'consumed') {
      const itemToRestore = consumedItems.find(item => (item._id === itemId || item.id === itemId));
      if (itemToRestore) {
        // Update the backend
        fetch(`${API_URL}/food-items/${itemToRestore._id || itemToRestore.id}/restore`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
        // Add back to active items (without the removedDate field)
        const { removedDate, ...restoredItem } = itemToRestore;
        setItems([...items, restoredItem]);
        // Remove from consumed items
            setConsumedItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          } else {
            alert("Failed to restore item. Please try again.");
          }
        })
        .catch(error => {
          console.error("Error restoring item:", error);
          alert("Error restoring item. Please try again.");
        });
      }
    } else if (source === 'wasted') {
      const itemToRestore = wastedItems.find(item => (item._id === itemId || item.id === itemId));
      if (itemToRestore) {
        // Update the backend
        fetch(`${API_URL}/food-items/${itemToRestore._id || itemToRestore.id}/restore`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
        // Add back to active items (without the removedDate field)
        const { removedDate, ...restoredItem } = itemToRestore;
        setItems([...items, restoredItem]);
        // Remove from wasted items
            setWastedItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          } else {
            alert("Failed to restore item. Please try again.");
          }
        })
        .catch(error => {
          console.error("Error restoring item:", error);
          alert("Error restoring item. Please try again.");
        });
      }
    } else if (source === 'deleted') {
      const itemToRestore = deletedItems.find(item => (item._id === itemId || item.id === itemId));
      if (itemToRestore) {
        // Update the backend
        fetch(`${API_URL}/food-items/${itemToRestore._id || itemToRestore.id}/restore`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            // Add back to active items (without the removedDate field)
            const { removedDate, ...restoredItem } = itemToRestore;
            setItems([...items, restoredItem]);
            // Remove from deleted items
            setDeletedItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          } else {
            alert("Failed to restore item. Please try again.");
          }
        })
        .catch(error => {
          console.error("Error restoring item:", error);
          alert("Error restoring item. Please try again.");
        });
      }
    }
  }

  // Function to permanently delete items from consumed, wasted, or deleted lists
  const handleDeleteItem = (itemId, source) => {
    const token = localStorage.getItem("token");
    
    if (source === 'consumed') {
      const itemToDelete = consumedItems.find(item => (item._id === itemId || item.id === itemId));
      if (itemToDelete) {
        // Delete from backend
        fetch(`${API_URL}/food-items/${itemToDelete._id || itemToDelete.id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            // Remove from consumed items in UI
            setConsumedItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          } else {
            return response.json().then(data => {
              throw new Error(data.message || "Failed to delete item");
            }).catch(() => {
              throw new Error("Failed to delete item");
            });
          }
        })
        .catch(error => {
          console.error("Error deleting item:", error);
          alert("Error deleting item. Please try again.");
        });
      }
    } else if (source === 'wasted') {
      const itemToDelete = wastedItems.find(item => (item._id === itemId || item.id === itemId));
      if (itemToDelete) {
        // Delete from backend
        fetch(`${API_URL}/food-items/${itemToDelete._id || itemToDelete.id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            // Remove from wasted items in UI
            setWastedItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
          } else {
            return response.json().then(data => {
              throw new Error(data.message || "Failed to delete item");
            }).catch(() => {
              throw new Error("Failed to delete item");
            });
          }
        })
        .catch(error => {
          console.error("Error deleting item:", error);
          alert("Error deleting item. Please try again.");
        });
      }
    } else if (source === 'deleted') {
      (async () => {
        console.log("Attempting to permanently delete item with ID:", itemId);
        
        // Find the item by ID to confirm it exists
        const itemToDelete = deletedItems.find(item => 
          (item._id === itemId || item.id === itemId)
        );
        
        if (!itemToDelete) {
          console.error("Item not found in deleted items:", itemId);
          console.log("Available deleted items:", deletedItems);
          alert("Error: Item not found. Please refresh the page and try again.");
          return;
        }
        
        console.log("Found item to delete:", itemToDelete);
        
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${itemToDelete.name}? This cannot be undone.`)) {
          return; // User cancelled
        }
        
        const itemIdToUse = itemToDelete._id || itemToDelete.id;
        console.log("Using ID for deletion:", itemIdToUse);
        
        try {
          // Permanently delete from backend
          const response = await fetch(`${API_URL}/food-items/${itemIdToUse}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          console.log("Delete response status:", response.status);
          
          if (response.ok) {
            // Remove from deleted items in UI
            setDeletedItems(prev => prev.filter(item => 
              (item._id !== itemId && item.id !== itemId)
            ));
            alert(`${itemToDelete.name} has been permanently deleted.`);
          } else {
            const errorText = await response.text();
            console.error("Error response text:", errorText);
            
            let errorMessage = "Failed to permanently delete item";
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If not JSON, use text directly if available
              if (errorText) errorMessage = errorText;
            }
            
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error("Error permanently deleting item:", error);
          alert(`Error deleting item: ${error.message}. Please try again.`);
        }
      })();
    }
  }

  // Update the handleLogout function
  const handleLogout = () => {
    try {
      // Clear authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Reset state
      setUser(null);
      setActiveTab("Dashboard");
      
      // Reset all items
      setItems([]);
      setConsumedItems([]);
      setWastedItems([]);
      
      // Show login form (not signup)
      setShowLoginForm(true);
      
      // Reload page (optional - may help with certain issues)
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Profile management states
  const [updatedName, setUpdatedName] = useState("")
  const [updatedEmail, setUpdatedEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedAvatarId, setSelectedAvatarId] = useState(user?.avatarId || 1);
  const [showWhitelistInstructions, setShowWhitelistInstructions] = useState(false);

  // Initialize profile states with user data when user changes
  useEffect(() => {
    if (user) {
      setUpdatedName(user.name || "")
      setUpdatedEmail(user.email || "")
    }
  }, [user])

  // Handle avatar update
  const handleAvatarUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/users/update-avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ avatarId: selectedAvatarId })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local user state
        setUser({ ...user, avatarId: selectedAvatarId });
        alert("Avatar updated successfully");
      } else {
        alert(data.message || "Failed to update avatar");
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Error updating avatar. Please try again.");
    }
  };

  // Track items selected for batch operations
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Toggle selection mode on/off
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]);
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Delete multiple items
  const deleteSelectedItems = () => {
    if (selectedItems.length === 0) {
      alert("No items selected");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`)) {
      const token = localStorage.getItem("token");
      
      // Create a copy of selected items before they're modified during deletion
      const itemsToDelete = [...selectedItems];
      let successCount = 0;
      let errorCount = 0;
      
      // Store the items being deleted so we can add them to deletedItems
      const itemObjectsToDelete = items.filter(item => 
        itemsToDelete.includes(item._id) || itemsToDelete.includes(item.id)
      );
      
      console.log("Items to delete:", itemObjectsToDelete);
      
      // Process each status change to "deleted"
      const deletePromises = itemsToDelete.map(itemId => {
        // Find the full item object to get the correct ID
        const itemObject = items.find(item => item._id === itemId || item.id === itemId);
        if (!itemObject) {
          errorCount++;
          console.error("Item not found for ID:", itemId);
          return Promise.resolve({ success: false, itemId, error: "Item not found" });
        }
        
        const actualId = itemObject._id || itemObject.id;
        console.log(`Processing item ${itemObject.name} with ID ${actualId}`);
        
        return fetch(`${API_URL}/food-items/${actualId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status: "deleted", removedDate: new Date() })
        })
        .then(response => {
          if (response.ok) {
            return response.json().then(data => {
              successCount++;
              console.log(`Successfully deleted item ${data.name}`);
              return { success: true, item: data };
            });
          } else {
            return response.json().then(data => {
              errorCount++;
              console.error(`Failed to delete item with ID ${actualId}:`, data.message);
              return { success: false, itemId, error: data.message };
            }).catch(() => {
              errorCount++;
              console.error(`Failed to parse error for item with ID ${actualId}`);
              return { success: false, itemId, error: "Unknown error" };
            });
          }
        })
        .catch(error => {
          errorCount++;
          console.error(`Network error while deleting item with ID ${actualId}:`, error);
          return { success: false, itemId, error: error.message };
        });
      });
      
      // After all status changes are processed
      Promise.all(deletePromises)
        .then((results) => {
          // Add successfully deleted items to deletedItems with their returned data
          const successfullyDeletedItems = results
            .filter(result => result.success)
            .map(result => result.item);
          
          console.log("Successfully deleted items:", successfullyDeletedItems);
          
          if (successfullyDeletedItems.length > 0) {
            setDeletedItems(prevDeleted => [
              ...prevDeleted,
              ...successfullyDeletedItems
            ]);
          }
          
          // Update local state to remove deleted items
          setItems(prevItems => 
            prevItems.filter(item => 
              !itemsToDelete.some(id => id === item._id || id === item.id)
            )
          );
          
          // Fetch deleted items to ensure state is in sync
          fetch(`${API_URL}/food-items/deleted`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })
          .then(response => response.json())
          .then(deletedData => {
            console.log("Synced deleted items from server:", deletedData);
            setDeletedItems(deletedData);
          })
          .catch(error => {
            console.error("Error fetching updated deleted items:", error);
          });
          
          // Reset selection mode and selected items
          setIsSelectionMode(false);
          setSelectedItems([]);
          
          // Provide feedback
          if (successCount > 0 && errorCount === 0) {
            alert(`Successfully deleted ${successCount} item(s).`);
          } else if (successCount > 0 && errorCount > 0) {
            alert(`Deleted ${successCount} item(s), but ${errorCount} failed.`);
          } else {
            alert("Failed to delete any items.");
          }
        })
        .catch(error => {
          console.error("Error in batch deletion:", error);
          alert("An error occurred during batch deletion. Please try again.");
        });
    }
  };

  // If auth is loading, show a loading state
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-container">
          <Loader size={40} className="spinner" />
          <div>Loading...</div>
        </div>
      </div>
    );
  }
  
  // If no user is logged in, show the Auth component
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Auth />} />
        </Routes>
      </Router>
    );
  }

  // Render the appropriate content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            <div className="user-greeting">
              <h className="greeting-text">Hello, {user.name}!</h>
              <p className="greeting-subtext">Welcome back to your food dashboard</p>
            </div>
            <div className="dashboard-grid">
              <ResizableCard cardId="upcomingExpirations" size={cardSizes.upcomingExpirations} onSizeChange={handleCardSizeChange}>
                <UpcomingExpirations items={items} onItemAction={handleItemAction} />
              </ResizableCard>
              
              <ResizableCard cardId="recipeSuggestions" size={cardSizes.recipeSuggestions} onSizeChange={handleCardSizeChange}>
                <RecipeSuggestions items={items} />
              </ResizableCard>
              
              <ResizableCard cardId="addItem" size={cardSizes.addItem} onSizeChange={handleCardSizeChange}>
                <div className="add-item-section">
                  <AddItem onAddClick={() => setShowAddModal(true)} />
                </div>
              </ResizableCard>
              
              <ResizableCard cardId="wastedSaved" size={cardSizes.wastedSaved} onSizeChange={handleCardSizeChange}>
                <WastedSavedFood consumedItems={consumedItems} wastedItems={wastedItems} />
              </ResizableCard>
            </div>
          </>
        );
      
      case "FoodInventory":
        return (
          <>
            <h1 className="app-title">Food Inventory</h1>
            <div className="inventory-container">
              <div className="card inventory-list">
                <h2>Your Food Items</h2>
                <p>Manage your food inventory and track freshness</p>
                
                {loading ? (
                  <div className="loading-state">Loading food inventory...</div>
                ) : fetchError ? (
                  <div className="error-state">
                    <p>Error: {fetchError}</p>
                    <button onClick={fetchFoodItems} className="retry-button">
                      Retry
                    </button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="empty-state">
                    <p>No items in your inventory yet</p>
                    <button className="submit-button" onClick={() => setShowAddModal(true)}>
                      Add Your First Item
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="inventory-controls">
                      <button 
                        className={`selection-mode-toggle ${isSelectionMode ? 'active' : ''}`}
                        onClick={toggleSelectionMode}
                      >
                        {isSelectionMode ? 'Cancel Selection' : 'Select Items'}
                      </button>
                      
                      {isSelectionMode && (
                        <button 
                          className="delete-selected-btn" 
                          onClick={deleteSelectedItems}
                          disabled={selectedItems.length === 0}
                        >
                          Delete Selected ({selectedItems.length})
                        </button>
                      )}
                    </div>
                    
                    <div className="items-table">
                      <table>
                        <thead>
                          <tr>
                            {isSelectionMode && <th>Mark</th>}
                            <th>Item</th>
                            <th>Storage</th>
                            <th>Added Date</th>
                            <th>Expires</th>
                            <th>Freshness</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item._id} className={selectedItems.includes(item._id) ? 'selected-row' : ''}>
                              {isSelectionMode && (
                                <td>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedItems.includes(item._id)}
                                    onChange={() => toggleItemSelection(item._id)}
                                  />
                                </td>
                              )}
                              <td>{item.name}</td>
                              <td>{item.storage}</td>
                              <td>{formatDate(new Date(item.addedDate))}</td>
                              <td>{formatDate(new Date(item.expiryDate))}</td>
                              <td>
                                <FreshnessBar 
                                  freshness={item.freshness} 
                                  isExpired={new Date(item.expiryDate) < currentDate}
                                />
                              </td>
                              <td>
                                <div className="inventory-actions">
                                  <button 
                                    className="inventory-action-button extend" 
                                    title="Extend expiry date by 1 day"
                                    onClick={() => handleItemAction(item._id, 'extend')}
                                  >
                                    Extend Expiry +1
                                  </button>
                                  <button 
                                    className="inventory-action-button edit" 
                                    title="Edit expiry date"
                                    onClick={() => handleItemAction(item._id, 'edit-expiry')}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Edit Expiry
                                  </button>
                                  <button 
                                    className="inventory-action-button storage" 
                                    title="Change storage location"
                                    onClick={() => handleItemAction(item._id, 'edit-storage')}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Change Storage
                                  </button>
                                  <button 
                                    className="inventory-action-button condition" 
                                    title="Update item condition"
                                    onClick={() => handleItemAction(item._id, 'edit-condition')}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M3 9v10a2 2 0 0 0 2 2h4m-6-6h6m4 0h6m4-6v10a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Update Condition
                                  </button>
                                  <button 
                                    className="inventory-action-button delete" 
                                    title="Delete item"
                                    onClick={() => handleItemAction(item._id, 'delete')}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <button className="submit-button add-inventory-btn" onClick={() => setShowAddModal(true)}>
                      Add New Item
                    </button>
                  </>
                )}
              </div>
              
              <FoodInsights items={items} />
            </div>
          </>
        );
      case "SavedRecipes":
        return (
          <>
            <h1 className="app-title">Saved Recipes</h1>
            <div className="saved-recipes-container">
              <SavedRecipes />
            </div>
          </>
        );
      case "RemovedItems":
        return (
          <>
            <h1 className="app-title">Removed Items</h1>
            <div className="removed-items-container" style={{ maxWidth: "800px" }}>
              <RemovedItems 
                consumedItems={consumedItems} 
                wastedItems={wastedItems} 
                deletedItems={deletedItems}
                onRestore={handleRestoreItem} 
                onDelete={handleDeleteItem}
              />
            </div>
          </>
        );
      case "Alerts":
        return (
          <>
            <h1 className="app-title">Alerts</h1>
            <div className="alerts-container">
              <div className="card">
                <h2>Food Alerts</h2>
                <p>Get notified when your food is about to expire</p>
                
                <div className="alerts-actions">
                  <button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        if (!token) {
                          alert("Not authenticated");
                          return;
                        }

                        const response = await fetch(`${API_URL}/alerts/generate`, {
                          method: "GET",
                          headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                          }
                        });

                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(data.message || "Failed to generate alerts");
                        }

                        alert(`Alert generation successful: Created ${data.alertsCreated} alerts, Sent ${data.emailsSent} emails`);
                      } catch (err) {
                        console.error("Error generating alerts:", err);
                        alert(`Failed to generate alerts: ${err.message}`);
                      }
                    }} 
                    className="generate-alerts-button"
                  >
                    Generate Alerts
                  </button>
                </div>
                
                {items.filter(item => 
                  // Show alerts for:
                  item.freshness < 30 || // Low freshness items
                  new Date(item.expiryDate) < currentDate || // Expired items
                  isSameDay(new Date(item.expiryDate), currentDate) // Items expiring today
                ).length === 0 ? (
                  <div className="empty-alerts">
                    <p>No urgent alerts at the moment</p>
                    <div className="alert-status">All your food items are fresh!</div>
                  </div>
                ) : (
                  <div className="alerts-list">
                    {items
                      .filter(item => 
                        item.freshness < 30 || // Low freshness items
                        new Date(item.expiryDate) < currentDate || // Expired items
                        isSameDay(new Date(item.expiryDate), currentDate) // Items expiring today
                      )
                      .map(item => {
                        const isExpired = new Date(item.expiryDate) < currentDate;
                        const isExpiringToday = !isExpired && isSameDay(new Date(item.expiryDate), currentDate);
                        return (
                        <div className="alert-item" key={item._id}>
                            <div className="alert-icon">
                              {isExpired ? '⚠️' : isExpiringToday ? '🕒' : '⏰'}
                            </div>
                          <div className="alert-content">
                              <h3>{item.name} {isExpired ? 'has expired!' : isExpiringToday ? 'expires today!' : 'is about to expire!'}</h3>
                              <p>{isExpired ? 'Expired' : 'Expires'} {formatDate(new Date(item.expiryDate))}</p>
                              {item.freshnessReason && <p className="freshness-reason">{item.freshnessReason}</p>}
                              <FreshnessBar 
                                freshness={item.freshness}
                                isExpired={isExpired}
                                />
                              </div>
                            </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            </div>
          </>
        );
      case "Settings":
        return (
          <>
            <h1 className="app-title">Settings</h1>
            <div className="settings-container">
              <div className="card">
                <h2>Profile Management</h2>
                <p>Update your personal information and account settings</p>
                
                <div className="settings-section">
                  <h3>Personal Information</h3>
                  <div className="profile-section">
                    <div className="profile-picture-container">
                      <div className="profile-picture">
                        {user.avatarId ? (
                          <img 
                            src={AVATARS.find(a => a.id === user.avatarId)?.path || AVATARS[0].path} 
                            alt="Profile" 
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={64} />
                        )}
                      </div>
                      
                      <AvatarSelector 
                        selectedAvatarId={selectedAvatarId} 
                        onSelectAvatar={setSelectedAvatarId} 
                      />
                      
                      <button 
                        className="save-profile-btn" 
                        onClick={handleAvatarUpdate}
                        disabled={selectedAvatarId === user?.avatarId}
                      >
                        Update Avatar
                      </button>
                    </div>
                    
                    <div className="profile-form">
                      <div className="form-group">
                        <label htmlFor="username">Display Name</label>
                        <input 
                          type="text" 
                          id="username" 
                          value={updatedName}
                          onChange={(e) => setUpdatedName(e.target.value)}
                          placeholder="Your name" 
                        />
                        <button 
                          className="save-profile-btn" 
                          onClick={() => {
                            const token = localStorage.getItem("token");
                            
                            // Validate name
                            if (!updatedName.trim()) {
                              alert("Name cannot be empty");
                              return;
                            }
                            
                            // API call to update name
                            fetch(`${API_URL}/users/update-profile`, {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                              },
                              body: JSON.stringify({ name: updatedName })
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.user) {
                                // Update user data in localStorage and state
                                const updatedUser = { ...user, name: data.user.name };
                                localStorage.setItem("user", JSON.stringify(updatedUser));
                                setUser(updatedUser);
                                alert("Name updated successfully");
                              } else {
                                alert(data.message || "Failed to update name");
                              }
                            })
                            .catch(error => {
                              console.error("Error updating name:", error);
                              alert("Failed to update name. Please try again.");
                            });
                          }}
                          disabled={!updatedName || updatedName === user?.name}
                        >
                          Update Name
                        </button>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                          type="email" 
                          id="email" 
                          value={updatedEmail}
                          onChange={(e) => setUpdatedEmail(e.target.value)}
                          placeholder="Your email" 
                        />
                        <button 
                          className="save-profile-btn" 
                          onClick={() => {
                            const token = localStorage.getItem("token");
                            
                            // Validate email
                            if (!updatedEmail || !/\S+@\S+\.\S+/.test(updatedEmail)) {
                              alert("Please enter a valid email address");
                              return;
                            }
                            
                            // API call to update email
                            fetch(`${API_URL}/users/update-email`, {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                              },
                              body: JSON.stringify({ email: updatedEmail })
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.user) {
                                // Update user data in localStorage and state
                                const updatedUser = { ...user, email: data.user.email };
                                localStorage.setItem("user", JSON.stringify(updatedUser));
                                setUser(updatedUser);
                                alert("Email updated successfully");
                              } else {
                                alert(data.message || "Failed to update email");
                              }
                            })
                            .catch(error => {
                              console.error("Error updating email:", error);
                              alert("Failed to update email. Please try again.");
                            });
                          }}
                          disabled={!updatedEmail || updatedEmail === user?.email || !/\S+@\S+\.\S+/.test(updatedEmail)}
                        >
                          Update Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="settings-section">
                  <h3>Security</h3>
                  <div className="profile-section">
                    <div className="form-group">
                      <label htmlFor="current-password">Current Password</label>
                      <input 
                        type="password" 
                        id="current-password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password" 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="new-password">New Password</label>
                      <input 
                        type="password" 
                        id="new-password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password" 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirm-password">Confirm New Password</label>
                      <input 
                        type="password" 
                        id="confirm-password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password" 
                      />
                    </div>
                    
                    <button 
                      className="save-password-btn" 
                      onClick={() => {
                        const token = localStorage.getItem("token");
                        
                        // Validate passwords
                        if (!currentPassword) {
                          alert("Please enter your current password");
                          return;
                        }
                        
                        if (!newPassword || newPassword.length < 6) {
                          alert("New password must be at least 6 characters long");
                          return;
                        }
                        
                        if (newPassword !== confirmPassword) {
                          alert("New passwords do not match");
                          return;
                        }
                        
                        // API call to update password
                        fetch(`${API_URL}/users/update-password`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            currentPassword,
                            newPassword
                          })
                        })
                        .then(response => response.json())
                        .then(data => {
                          if (data.message && data.message.includes("successfully")) {
                            // Clear password fields
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            alert("Password updated successfully");
                          } else {
                            alert(data.message || "Failed to update password");
                          }
                        })
                        .catch(error => {
                          console.error("Error updating password:", error);
                          alert("Failed to update password. Please try again.");
                        });
                      }}
                      disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                    >
                      Update Password
                    </button>
                  </div>
                </div>
                
                <div className="settings-section">
                  <h3>Notification Preferences</h3>
                  <div className="settings-option">
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider round"></span>
                    </label>
                    <div className="setting-label">
                      <span>Expiry Notifications</span>
                      <p>Get notified before your food expires</p>
                    </div>
                  </div>
                  
                  <div className="settings-option">
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider round"></span>
                    </label>
                    <div className="setting-label">
                      <span>Weekly Summary</span>
                      <p>Receive a weekly summary of your food inventory</p>
                    </div>
                  </div>
                  
                  <div className="email-whitelist-section">
                    <h4>Email Deliverability</h4>
                    <p>
                      Are you missing notification emails or finding them in spam? 
                      To ensure emails are delivered to your inbox:
                    </p>
                    <button 
                      className="whitelist-button"
                      onClick={() => setShowWhitelistInstructions(true)}
                    >
                      How to Whitelist Our Emails
                    </button>
                  </div>
                </div>

                {/* <div className="settings-section">
                  <h3>Dashboard Layout</h3>
                  <p className="settings-description">Customize the size of dashboard cards to focus on what matters most to you</p>
                  
                  <div className="card-size-settings">
                    <div className="card-size-option">
                      <h4>Upcoming Expirations</h4>
                      <div className="size-selector">
                        <button 
                          className={`size-btn ${cardSizes.upcomingExpirations === 'small' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('upcomingExpirations', 'small')}
                        >
                          Small
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.upcomingExpirations === 'medium' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('upcomingExpirations', 'medium')}
                        >
                          Medium
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.upcomingExpirations === 'large' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('upcomingExpirations', 'large')}
                        >
                          Large
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-size-option">
                      <h4>Recipe Suggestions</h4>
                      <div className="size-selector">
                        <button 
                          className={`size-btn ${cardSizes.recipeSuggestions === 'small' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('recipeSuggestions', 'small')}
                        >
                          Small
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.recipeSuggestions === 'medium' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('recipeSuggestions', 'medium')}
                        >
                          Medium
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.recipeSuggestions === 'large' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('recipeSuggestions', 'large')}
                        >
                          Large
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-size-option">
                      <h4>Add Item</h4>
                      <div className="size-selector">
                        <button 
                          className={`size-btn ${cardSizes.addItem === 'small' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('addItem', 'small')}
                        >
                          Small
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.addItem === 'medium' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('addItem', 'medium')}
                        >
                          Medium
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.addItem === 'large' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('addItem', 'large')}
                        >
                          Large
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-size-option">
                      <h4>Wasted vs. Saved Food</h4>
                      <div className="size-selector">
                        <button 
                          className={`size-btn ${cardSizes.wastedSaved === 'small' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('wastedSaved', 'small')}
                        >
                          Small
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.wastedSaved === 'medium' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('wastedSaved', 'medium')}
                        >
                          Medium
                        </button>
                        <button 
                          className={`size-btn ${cardSizes.wastedSaved === 'large' ? 'active' : ''}`}
                          onClick={() => handleCardSizeChange('wastedSaved', 'large')}
                        >
                          Large
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      className="reset-layout-btn"
                      onClick={() => {
                        const defaultSizes = {
                          upcomingExpirations: "medium",
                          recipeSuggestions: "medium",
                          addItem: "medium",
                          wastedSaved: "medium"
                        };
                        setCardSizes(defaultSizes);
                        localStorage.setItem("cardSizes", JSON.stringify(defaultSizes));
                      }}
                    >
                      Reset to Default Layout
                    </button>
                  </div>
                </div> */}
              </div>
            </div>
            
            {showWhitelistInstructions && (
              <WhitelistInstructions 
                onClose={() => setShowWhitelistInstructions(false)} 
              />
            )}
          </>
        );
      default:
        return (
          <h1 className="app-title">WasteNot</h1>
        );
    }
  };

  // Regular app UI for authenticated users
  return (
    <div className="app">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} // Pass user explicitly
        onLogout={handleLogout} // Pass logout function 
      />
      <ThemeToggle />
      <div className="main-content">
        {renderContent()}
      </div>
      
      {showAddModal && (
        <AddItemModal onClose={() => setShowAddModal(false)} onAdd={addItem} />
      )}
    </div>
  )
}

export default App

// Helper function to check if two dates are the same day (ignoring time)
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}
