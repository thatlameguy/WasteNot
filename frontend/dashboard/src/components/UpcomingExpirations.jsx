"use client"

import { useState, useEffect } from "react"
import FreshnessBar from "./FreshnessBar"
import { API_URL } from "../utils/api"

function UpcomingExpirations({ items, onItemAction }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("expiry") // "expiry" or "freshness"
  const [filterDays, setFilterDays] = useState("all") // "all", "today", "week", "month"
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    thisWeek: true,
    thisMonth: true,
    later: true
  })
  const [filteredItems, setFilteredItems] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showFilters, setShowFilters] = useState(false)
  const [calculatingItems, setCalculatingItems] = useState({}) // Track items being calculated

  // Update current date every minute for real-time expiry tracking
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(dateInterval)
  }, [])

  // Format date to "May 10" format
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Calculate days until expiry with real-time updates
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Group items by expiry timeframe
  const getGroupedItems = (items) => {
    return {
      today: items.filter(item => getDaysUntilExpiry(item.expiryDate) <= 0),
      thisWeek: items.filter(item => getDaysUntilExpiry(item.expiryDate) > 0 && getDaysUntilExpiry(item.expiryDate) <= 7),
      thisMonth: items.filter(item => getDaysUntilExpiry(item.expiryDate) > 7 && getDaysUntilExpiry(item.expiryDate) <= 30),
      later: items.filter(item => getDaysUntilExpiry(item.expiryDate) > 30)
    }
  }

  // Helper function to get human-readable expiry text
  const getExpiryText = (daysUntil) => {
    if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} days ago`
    if (daysUntil === 0) return "Expires today"
    if (daysUntil === 1) return "Expires tomorrow"
    return `Expires in ${daysUntil} days`
  }

  // Filter and sort items when dependencies change
  useEffect(() => {
    let result = [...items]
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply day filter
    if (filterDays !== "all") {
      const daysMap = {
        "today": 0,
        "week": 7,
        "month": 30
      }
      
      if (filterDays === "today") {
        result = result.filter(item => getDaysUntilExpiry(item.expiryDate) <= daysMap[filterDays])
      } else {
        result = result.filter(item => 
          getDaysUntilExpiry(item.expiryDate) > 0 && 
          getDaysUntilExpiry(item.expiryDate) <= daysMap[filterDays]
        )
      }
    }
    
    // Apply sort
    result.sort((a, b) => {
      if (sortBy === "expiry") {
        return new Date(a.expiryDate) - new Date(b.expiryDate)
      } else {
        return a.freshness - b.freshness
      }
    })
    
    setFilteredItems(result)
  }, [items, searchTerm, sortBy, filterDays, currentDate]) // Added currentDate dependency for real-time updates

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    })
  }

  // Get urgency class based on days until expiry
  const getUrgencyClass = (daysUntil) => {
    if (daysUntil <= 0) return "urgent"
    if (daysUntil <= 3) return "warning"
    return ""
  }

  // Handle marking an item as consumed
  const handleMarkAsConsumed = (itemId) => {
    if (onItemAction) {
      onItemAction(itemId, 'consumed');
    }
  }

  // Handle marking an item as wasted
  const handleMarkAsWasted = (itemId) => {
    if (onItemAction) {
      onItemAction(itemId, 'wasted');
    }
  }

  // Handle updating item condition
  const handleUpdateCondition = (itemId) => {
    if (onItemAction) {
      onItemAction(itemId, 'edit-condition');
    }
  }

  // Recalculate freshness using Groq AI
  const recalculateFreshness = async (itemId) => {
    try {
      // Prevent duplicate calculations
      if (calculatingItems[itemId]) {
        return;
      }
      
      setCalculatingItems(prev => ({ ...prev, [itemId]: true }));
      
      const token = localStorage.getItem("token");
      if (!token) {
        // Use toast notification if available in your app, or fallback to alert
        alert("You must be logged in to perform this action");
        setCalculatingItems(prev => ({ ...prev, [itemId]: false }));
        return;
      }
      
      // Find the current item to show name in status messages
      const currentItem = filteredItems.find(item => (item._id || item.id) === itemId);
      const itemName = currentItem ? currentItem.name : "Item";
      
      try {
        const response = await fetch(`${API_URL}/food-items/${itemId}/freshness`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check that we received a valid freshness value
        if (typeof data.freshness !== 'number' || isNaN(data.freshness)) {
          throw new Error("Received invalid freshness value");
        }
        
        // Update item with the recalculated freshness
        if (onItemAction) {
          onItemAction(itemId, 'update-freshness', data.freshness);
          
          // Show success message with the freshness change
          const oldFreshness = currentItem ? currentItem.freshness : 0;
          const freshnessChange = data.freshness - oldFreshness;
          const changeText = freshnessChange > 0 
            ? `increased by ${Math.abs(Math.round(freshnessChange))}%` 
            : `decreased by ${Math.abs(Math.round(freshnessChange))}%`;
          
          alert(`${itemName} freshness recalculated: ${Math.round(data.freshness)}% (${changeText})`);
        }
      } catch (error) {
        console.error("Error recalculating freshness:", error);
        alert(`Error recalculating freshness for ${itemName}: ${error.message}`);
      } finally {
        setCalculatingItems(prev => ({ ...prev, [itemId]: false }));
      }
    } catch (outerError) {
      console.error("Unexpected error in recalculateFreshness:", outerError);
      alert("An unexpected error occurred. Please try again.");
      setCalculatingItems({});
    }
  };

  // Renders a single expiry item
  const renderExpiryItem = (item) => {
    const daysUntil = getDaysUntilExpiry(item.expiryDate)
    const urgencyClass = getUrgencyClass(daysUntil)
    const itemId = item._id || item.id
    const isCalculating = calculatingItems[itemId] || false
    const isExpired = daysUntil < 0
    
    return (
      <div 
        key={itemId} 
        className={`expiring-item ${urgencyClass}`}
        onMouseEnter={() => setHoveredItem(itemId)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="item-details">
          <span className="item-name">{item.name}</span>
          <span className="expiry-date">{formatDate(new Date(item.expiryDate))}</span>
        </div>
        <div className="item-expiry-text">
          {getExpiryText(daysUntil)}
        </div>
        <div className="item-condition">Condition: {item.condition}</div>
        <div className="freshness-container-wrapper">
          <FreshnessBar freshness={item.freshness} isExpired={isExpired} />
          <button 
            className="recalculate-button"
            onClick={() => recalculateFreshness(itemId)}
            disabled={isCalculating}
            title="Recalculate freshness with AI"
          >
            {isCalculating ? "..." : "🔄"}
          </button>
        </div>
        
        {hoveredItem === itemId && (
          <div className="item-actions">
            <button 
              className="action-button consume" 
              title="Mark as consumed"
              onClick={() => handleMarkAsConsumed(itemId)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="action-button update" 
              title="Update condition"
              onClick={() => handleUpdateCondition(itemId)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M3 9v10a2 2 0 0 0 2 2h4m-6-6h6m4 0h6m4-6v10a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="action-button remove" 
              title="Mark as wasted"
              onClick={() => handleMarkAsWasted(itemId)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Render a section of items
  const renderSection = (title, items, sectionKey) => {
    if (items.length === 0) return null
    
    return (
      <div className="expiry-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection(sectionKey)}
        >
          <h3>{title} <span className="item-count">({items.length})</span></h3>
          <span className="toggle-icon">
            {expandedSections[sectionKey] ? '−' : '+'}
          </span>
        </div>
        
        {expandedSections[sectionKey] && (
          <div className="section-items">
            {items.map(renderExpiryItem)}
          </div>
        )}
      </div>
    )
  }

  // Group items by timeframe
  const groupedItems = getGroupedItems(filteredItems)
  const totalItems = filteredItems.length

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = document.querySelector('.filter-dropdown');
      const menuButton = document.querySelector('.menu-button');
      
      if (dropdownElement && !dropdownElement.contains(event.target) && 
          menuButton && !menuButton.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="card upcoming-expirations">
      <div className="card-header">
        <div className="header-content">
          <h2>Upcoming Expirations</h2>
          <p>{totalItems} items expiring soon</p>
        </div>
        <div className="filter-toggle">
          <button 
            className="menu-button" 
            onClick={() => setShowFilters(!showFilters)}
            title="Filter options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="6" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
          
          {showFilters && (
            <div className="filter-dropdown">
              <div className="dropdown-header">
                <h3>Filter Options</h3>
                <button 
                  className="close-dropdown" 
                  onClick={() => setShowFilters(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm("")}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Sort by:</label>
                <div className="button-group">
                  <button 
                    className={`filter-button ${sortBy === "expiry" ? "active" : ""}`}
                    onClick={() => setSortBy("expiry")}
                  >
                    Expiry Date
                  </button>
                  <button 
                    className={`filter-button ${sortBy === "freshness" ? "active" : ""}`}
                    onClick={() => setSortBy("freshness")}
                  >
                    Freshness
                  </button>
                </div>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Time frame:</label>
                <div className="button-group">
                  <button 
                    className={`filter-button ${filterDays === "all" ? "active" : ""}`}
                    onClick={() => setFilterDays("all")}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-button ${filterDays === "today" ? "active" : ""}`}
                    onClick={() => setFilterDays("today")}
                  >
                    Today
                  </button>
                  <button 
                    className={`filter-button ${filterDays === "week" ? "active" : ""}`}
                    onClick={() => setFilterDays("week")}
                  >
                    Week
                  </button>
                  <button 
                    className={`filter-button ${filterDays === "month" ? "active" : ""}`}
                    onClick={() => setFilterDays("month")}
                  >
                    Month
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="expiring-items-container">
        {filteredItems.length === 0 ? (
          <div className="empty-expirations">
            <p>No items match your filters</p>
            {searchTerm && <button onClick={() => setSearchTerm("")}>Clear search</button>}
            {filterDays !== "all" && <button onClick={() => setFilterDays("all")}>Show all items</button>}
          </div>
        ) : (
          <>
            {renderSection("Expired or Expires Today", groupedItems.today, "today")}
            {renderSection("This Week", groupedItems.thisWeek, "thisWeek")}
            {renderSection("This Month", groupedItems.thisMonth, "thisMonth")}
            {renderSection("Later", groupedItems.later, "later")}
          </>
        )}
      </div>
    </div>
  )
}

export default UpcomingExpirations
