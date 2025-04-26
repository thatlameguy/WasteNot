import { useState, useEffect } from "react"
import { Loader, Bell, Check, Trash2, AlertTriangle, Clock, RefreshCw } from "lucide-react"

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [generatingAlerts, setGeneratingAlerts] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  useEffect(() => {
    // Generate and fetch alerts when component mounts
    generateAndFetchAlerts()

    // Set up polling to check for new alerts every 3 minutes
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing alerts...")
      fetchAlerts()
    }, 3 * 60 * 1000) // 3 minutes in milliseconds

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [])

  // New function to generate alerts and then fetch them
  const generateAndFetchAlerts = async () => {
    try {
      setGeneratingAlerts(true)
      // First generate new alerts
      await generateAlerts()
      // Then fetch them
      await fetchAlerts()
    } catch (err) {
      console.error("Error in generate and fetch flow:", err)
      setError(err.message || "Failed to refresh alerts")
    } finally {
      setGeneratingAlerts(false)
    }
  }

  // New function to trigger alert generation on the backend
  const generateAlerts = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch("http://localhost:8000/api/alerts/generate", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to generate alerts")
      }

      const result = await response.json()
      console.log("Alerts generated:", result)
      return result
    } catch (err) {
      console.error("Error generating alerts:", err)
      throw err
    }
  }

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch("http://localhost:8000/api/alerts", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch alerts")
      }

      setAlerts(data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Error fetching alerts:", err)
      setError(err.message || "Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to mark alert as read")
      }

      // Update local state
      setAlerts(alerts.map(alert => 
        alert._id === alertId ? { ...alert, isRead: true } : alert
      ))
    } catch (err) {
      console.error("Error marking alert as read:", err)
      alert(`Failed to mark as read: ${err.message}`)
    }
  }

  const clearAllAlerts = async () => {
    if (!window.confirm("Are you sure you want to clear all alerts?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch("http://localhost:8000/api/alerts", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to clear alerts")
      }

      setAlerts([])
    } catch (err) {
      console.error("Error clearing alerts:", err)
      alert(`Failed to clear alerts: ${err.message}`)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getAlertIcon = (type, daysRemaining) => {
    if (type === 'expired') {
      return <AlertTriangle className="alert-icon expired" />
    }
    if (daysRemaining === 1) {
      return <Clock className="alert-icon tomorrow" />
    }
    return <Bell className="alert-icon expiring" />
  }

  const getAlertTitle = (alert) => {
    const expiryDate = new Date(alert.expiryDate);
    const formattedDate = expiryDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    if (alert.type === 'expired') {
      return `${alert.itemName} has expired on ${formattedDate}!`;
    }
    if (alert.daysRemaining === 1) {
      return `${alert.itemName} will expire TOMORROW (${formattedDate})!`;
    }
    return `${alert.itemName} will expire ${alert.daysRemaining === 0 ? 'today' : 
      `in ${alert.daysRemaining} days`} (${formattedDate})`;
  }

  const getFreshnessLabel = (freshness) => {
    if (freshness >= 80) return "Excellent";
    if (freshness >= 60) return "Good";
    if (freshness >= 40) return "Fair";
    if (freshness >= 20) return "Poor";
    return "Bad";
  }

  const getFreshnessColor = (freshness) => {
    if (freshness >= 80) return "#22c55e"; // Green
    if (freshness >= 60) return "#84cc16"; // Light green
    if (freshness >= 40) return "#eab308"; // Yellow
    if (freshness >= 20) return "#f97316"; // Orange
    return "#ef4444"; // Red
  }

  const getUnreadCount = () => {
    return alerts.filter(alert => !alert.isRead).length
  }

  return (
    <div className="alerts-dashboard">
      <div className="alerts-header">
        <div className="alerts-title">
          <h2>Food Alerts</h2>
          {getUnreadCount() > 0 && (
            <span className="unread-badge">{getUnreadCount()}</span>
          )}
        </div>
        
        <div className="alerts-actions">
          <button 
            onClick={generateAndFetchAlerts} 
            className="refresh-button generate-alerts-button" 
            disabled={loading || generatingAlerts}
            title="Generate and refresh alerts"
          >
            {generatingAlerts ? (
              <>
                <Loader className="spinner" size={16} />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Refresh Alerts
              </>
            )}
          </button>
          
          {alerts.length > 0 && (
            <button onClick={clearAllAlerts} className="clear-all-button">
              Clear All
            </button>
          )}
          
          {lastRefresh && (
            <div className="last-refresh-time">
              <small>Last updated: {lastRefresh.toLocaleTimeString()}</small>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-alerts">
          <Loader className="spinner" />
          <p>Loading your alerts...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchAlerts} className="retry-button">
            Retry
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-alerts">
          <p>No food alerts at the moment</p>
          <div className="alert-status">All your food items are fresh!</div>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts
            .sort((a, b) => {
              if (a.daysRemaining === 1 && b.daysRemaining !== 1) return -1;
              if (a.daysRemaining !== 1 && b.daysRemaining === 1) return 1;
              if (!a.isRead && b.isRead) return -1;
              if (a.isRead && !b.isRead) return 1;
              return a.daysRemaining - b.daysRemaining;
            })
            .map((alert) => (
            <div 
              key={alert._id} 
              className={`alert-item ${alert.isRead ? 'read' : 'unread'} ${alert.type} ${alert.daysRemaining === 1 ? 'tomorrow-alert' : ''}`}
            >
              {getAlertIcon(alert.type, alert.daysRemaining)}
              
              <div className="alert-content">
                <h3>{getAlertTitle(alert)}</h3>
                <p>Expiration date: {formatDate(alert.expiryDate)}</p>
                
                {/* Display food item details */}
                {alert.foodItemId && (
                  <div className="food-item-details">
                    {alert.foodItemId.storage && (
                      <p>Storage: {alert.foodItemId.storage}</p>
                    )}
                    {alert.foodItemId.condition && (
                      <p>Condition: {alert.foodItemId.condition}</p>
                    )}
                    {alert.foodItemId.freshness !== undefined && (
                      <div className="freshness-indicator">
                        <p>
                          Freshness: 
                          <span 
                            style={{ 
                              color: getFreshnessColor(alert.foodItemId.freshness),
                              fontWeight: 'bold',
                              marginLeft: '4px'
                            }}
                          >
                            {getFreshnessLabel(alert.foodItemId.freshness)}
                            {" "}({Math.round(alert.foodItemId.freshness)}%)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="alert-meta">
                  <span className="alert-date">
                    Alert created: {formatDate(alert.createdAt)}
                  </span>
                  
                  {alert.isEmailSent && (
                    <span className="email-sent">
                      Email notification sent
                    </span>
                  )}
                </div>
              </div>
              
              {!alert.isRead && (
                <button 
                  className="mark-read-button"
                  onClick={() => markAsRead(alert._id)}
                  aria-label="Mark as read"
                >
                  <Check size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Alerts
