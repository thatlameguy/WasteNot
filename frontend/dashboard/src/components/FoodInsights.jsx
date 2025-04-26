"use client"

import React, { useState, useEffect } from "react"

function FoodInsights({ items }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Update current date every minute for real-time insights
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(dateInterval)
  }, [])
  
  // Calculate days until expiry for each item with real-time updates
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Calculate insights
  const totalItems = items.length
  const expiringSoon = items.filter(item => {
    const daysUntil = getDaysUntilExpiry(item.expiryDate)
    return daysUntil >= 0 && daysUntil <= 3
  }).length
  
  const expired = items.filter(item => getDaysUntilExpiry(item.expiryDate) < 0).length
  
  // Calculate storage distribution
  const fridgeItems = items.filter(item => item.storage === "Fridge").length
  const freezerItems = items.filter(item => item.storage === "Freezer").length
  const pantryItems = items.filter(item => item.storage === "Pantry").length

  // Average freshness
  const avgFreshness = items.length > 0 
    ? Math.round(items.reduce((sum, item) => sum + item.freshness, 0) / items.length) 
    : 0

  // Most common food item
  const foodCounts = {}
  items.forEach(item => {
    foodCounts[item.name] = (foodCounts[item.name] || 0) + 1
  })
  
  let mostCommonFood = "None"
  let maxCount = 0
  
  Object.entries(foodCounts).forEach(([food, count]) => {
    if (count > maxCount) {
      mostCommonFood = food
      maxCount = count
    }
  })

  // Storage type analysis
  const storageAnalysis = {
    Fridge: {
      count: fridgeItems,
      avgFreshness: 0,
      expiringSoon: 0
    },
    Freezer: {
      count: freezerItems,
      avgFreshness: 0,
      expiringSoon: 0
    },
    Pantry: {
      count: pantryItems,
      avgFreshness: 0,
      expiringSoon: 0
    }
  }

  // Condition analysis
  const conditionAnalysis = {
    "Freshly bought": {
      count: 0,
      avgFreshness: 0,
      avoidedWaste: 0
    },
    "Near expiry": {
      count: 0,
      avgFreshness: 0,
      avoidedWaste: 0
    },
    "Already opened": {
      count: 0,
      avgFreshness: 0,
      avoidedWaste: 0
    }
  }

  // Calculate storage and condition insights using current date
  items.forEach(item => {
    // Storage analysis
    if (storageAnalysis[item.storage]) {
      const storage = storageAnalysis[item.storage]
      storage.avgFreshness += item.freshness
      
      const daysUntil = getDaysUntilExpiry(item.expiryDate)
      if (daysUntil >= 0 && daysUntil <= 3) {
        storage.expiringSoon++
      }
    }
    
    // Condition analysis
    if (conditionAnalysis[item.condition]) {
      const condition = conditionAnalysis[item.condition]
      condition.count++
      condition.avgFreshness += item.freshness
      
      // Calculate how much shelf life was extended by proper storage with current date
      const daysOwned = Math.floor((currentDate - new Date(item.addedDate)) / (1000 * 60 * 60 * 24))
      condition.avoidedWaste += daysOwned
    }
  })

  // Calculate averages for storage analysis
  Object.keys(storageAnalysis).forEach(key => {
    const storage = storageAnalysis[key]
    if (storage.count > 0) {
      storage.avgFreshness = Math.round(storage.avgFreshness / storage.count)
    }
  })

  // Calculate averages for condition analysis
  Object.keys(conditionAnalysis).forEach(key => {
    const condition = conditionAnalysis[key]
    if (condition.count > 0) {
      condition.avgFreshness = Math.round(condition.avgFreshness / condition.count)
    }
  })

  // Determine best storage method based on average freshness
  let bestStorage = "None"
  let bestStorageFreshness = 0
  
  Object.entries(storageAnalysis).forEach(([storage, data]) => {
    if (data.count > 0 && data.avgFreshness > bestStorageFreshness) {
      bestStorage = storage
      bestStorageFreshness = data.avgFreshness
    }
  })

  // Find items that expire quicker based on storage using current date
  const expiryRateByStorage = {}
  
  items.forEach(item => {
    if (!expiryRateByStorage[item.storage]) {
      expiryRateByStorage[item.storage] = []
    }
    
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate)
    const daysOwned = Math.floor((currentDate - new Date(item.addedDate)) / (1000 * 60 * 60 * 24))
    
    // Calculate expiry rate (how quickly it loses freshness)
    const expiryRate = daysOwned > 0 ? (100 - item.freshness) / daysOwned : 0
    
    expiryRateByStorage[item.storage].push(expiryRate)
  })
  
  // Calculate average expiry rate by storage
  Object.keys(expiryRateByStorage).forEach(storage => {
    const rates = expiryRateByStorage[storage]
    expiryRateByStorage[storage] = rates.length > 0
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      : 0
  })
  
  // Find storage with fastest expiry
  let fastestExpiryStorage = "None"
  let fastestExpiryRate = 0
  
  Object.entries(expiryRateByStorage).forEach(([storage, rate]) => {
    if (rate > fastestExpiryRate) {
      fastestExpiryStorage = storage
      fastestExpiryRate = rate
    }
  })

  return (
    <div className="card food-insights">
      <h2>Food Insights</h2>
      <p>Key statistics about your food inventory</p>
      
      <div className="last-updated">
        Last updated: {currentDate.toLocaleTimeString()}
      </div>
      
      <div className="insights-grid">
        <div className="insight-box">
          <span className="insight-value">{totalItems}</span>
          <span className="insight-label">Total Items</span>
        </div>
        
        <div className="insight-box">
          <span className="insight-value">{expiringSoon}</span>
          <span className="insight-label">Expiring Soon</span>
        </div>
        
        <div className="insight-box">
          <span className="insight-value">{expired}</span>
          <span className="insight-label">Expired</span>
        </div>
        
        <div className="insight-box">
          <span className="insight-value">{avgFreshness}%</span>
          <span className="insight-label">Average Freshness</span>
        </div>
      </div>
      
      <h3>Condition Impact on Freshness</h3>
      <div className="storage-distribution">
        <div className="storage-bar-container">
          <div className="insights-table">
            <table>
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Count</th>
                  <th>Avg. Freshness</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(conditionAnalysis).map(([condition, stats]) => (
                  stats.count > 0 && (
                    <tr key={condition}>
                      <td>
                        {condition}
                        {condition === "Freshly bought" && 
                          <span className="condition-badge fresh">Best</span>
                        }
                        {condition === "Already opened" && 
                          <span className="condition-badge opened">Moderate Risk</span>
                        }
                        {condition === "Near expiry" && 
                          <span className="condition-badge near-expiry">High Risk</span>
                        }
                      </td>
                      <td>{stats.count}</td>
                      <td>{stats.avgFreshness}%</td>
                      <td>
                        {condition === "Freshly bought" ? "Extended shelf life" : 
                         condition === "Already opened" ? "Reduced shelf life" : 
                         "Significantly reduced shelf life"}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <h3>Storage Distribution</h3>
      <div className="storage-distribution">
        <div className="storage-bar-container">
          <div className="storage-bars">
            <div 
              className="storage-bar fridge" 
              style={{ 
                width: totalItems > 0 ? `${(fridgeItems / totalItems) * 100}%` : '0%',
              }}
            ></div>
            <div 
              className="storage-bar freezer" 
              style={{ 
                width: totalItems > 0 ? `${(freezerItems / totalItems) * 100}%` : '0%',
              }}
            ></div>
            <div 
              className="storage-bar pantry" 
              style={{ 
                width: totalItems > 0 ? `${(pantryItems / totalItems) * 100}%` : '0%',
              }}
            ></div>
          </div>
        </div>
        
        <div className="storage-legend">
          <div className="legend-item">
            <span className="color-indicator fridge"></span>
            <span>Fridge ({fridgeItems})</span>
          </div>
          <div className="legend-item">
            <span className="color-indicator freezer"></span>
            <span>Freezer ({freezerItems})</span>
          </div>
          <div className="legend-item">
            <span className="color-indicator pantry"></span>
            <span>Pantry ({pantryItems})</span>
          </div>
        </div>
      </div>

      <h3>Storage & Condition Analysis</h3>
      <div className="storage-analysis">
        <div className="analysis-grid">
          {Object.entries(storageAnalysis).map(([storage, data]) => (
            data.count > 0 ? (
              <div key={storage} className="analysis-box">
                <h4>
                  {storage === "Fridge" ? "🧊 " : 
                   storage === "Freezer" ? "❄️ " : "📦 "}
                  {storage}
                </h4>
                <div className="analysis-stat">
                  <span className="stat-label">Avg Freshness:</span>
                  <span className="stat-value">{data.avgFreshness}%</span>
                </div>
                <div className="analysis-stat">
                  <span className="stat-label">Expiring Soon:</span>
                  <span className="stat-value">{data.expiringSoon} items</span>
                </div>
              </div>
            ) : null
          ))}
        </div>

        <div className="condition-grid">
          {Object.entries(conditionAnalysis).map(([condition, data]) => (
            data.count > 0 ? (
              <div key={condition} className="analysis-box">
                <h4>
                  {condition === "Freshly bought" ? "🟢 " : 
                   condition === "Near expiry" ? "🟡 " : "🔴 "}
                  {condition}
                </h4>
                <div className="analysis-stat">
                  <span className="stat-label">Count:</span>
                  <span className="stat-value">{data.count} items</span>
                </div>
                <div className="analysis-stat">
                  <span className="stat-label">Avg Freshness:</span>
                  <span className="stat-value">{data.avgFreshness}%</span>
                </div>
              </div>
            ) : null
          ))}
        </div>
      </div>
      
      <div className="additional-insights">
        <div className="insight-item">
          <h4>Most Common Food</h4>
          <p>{mostCommonFood}</p>
        </div>
        <div className="insight-item">
          <h4>Best Storage Method</h4>
          <p>{bestStorage !== "None" ? bestStorage : "Insufficient data"}</p>
        </div>
        <div className="insight-item">
          <h4>Expiry Rate</h4>
          <p>{fastestExpiryStorage !== "None" ? 
            `${fastestExpiryStorage} items expire fastest` : 
            "Insufficient data"}</p>
        </div>
        <div className="insight-item">
          <h4>Health Index</h4>
          <p>{avgFreshness > 70 ? "Good" : avgFreshness > 40 ? "Fair" : "Poor"}</p>
        </div>
      </div>
    </div>
  )
}

export default FoodInsights 