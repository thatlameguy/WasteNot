"use client"

import { useState } from "react"

function RemovedItems({ consumedItems, wastedItems, deletedItems, onRestore, onDelete }) {
  const [activeTab, setActiveTab] = useState("consumed")
  
  // Format date to a readable format
  const formatDate = (date) => {
    if (!date) return "Unknown date";
    try {
      return new Date(date).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "Invalid date";
    }
  }
  
  // Log when props change to help with debugging
  console.log("RemovedItems component received props:", {
    consumedItems: consumedItems?.length || 0,
    wastedItems: wastedItems?.length || 0,
    deletedItems: deletedItems?.length || 0
  });
  
  if (activeTab === "deleted" && deletedItems?.length > 0) {
    console.log("Rendering deleted items:", deletedItems);
  }
  
  // Safely access arrays with fallbacks
  const safeConsumedItems = Array.isArray(consumedItems) ? consumedItems : [];
  const safeWastedItems = Array.isArray(wastedItems) ? wastedItems : [];
  const safeDeletedItems = Array.isArray(deletedItems) ? deletedItems : [];

  return (
    <div className="card removed-items">
      <h2>Removed Items</h2>
      <p>View and restore items that were consumed, wasted, or deleted</p>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === "consumed" ? "active" : ""}`}
          onClick={() => setActiveTab("consumed")}
        >
          Consumed Items ({safeConsumedItems.length})
        </button>
        <button 
          className={`tab-button ${activeTab === "wasted" ? "active" : ""}`}
          onClick={() => setActiveTab("wasted")}
        >
          Wasted Items ({safeWastedItems.length})
        </button>
        <button 
          className={`tab-button ${activeTab === "deleted" ? "active" : ""}`}
          onClick={() => setActiveTab("deleted")}
        >
          Deleted Items ({safeDeletedItems.length})
        </button>
      </div>
      
      <div className="removed-items-container">
        {activeTab === "consumed" ? (
          <>
            {safeConsumedItems.length === 0 ? (
              <div className="empty-state">
                <p>No consumed items to display</p>
              </div>
            ) : (
              <div className="removed-items-list">
                {safeConsumedItems.map(item => (
                  <div className="removed-item" key={item._id || item.id}>
                    <div className="removed-item-details">
                      <span className="item-name">{item.name || "Unnamed item"}</span>
                      <span className="removed-date">Consumed on {formatDate(item.removedDate)}</span>
                    </div>
                    <div className="item-buttons">
                      <button 
                        className="restore-button"
                        onClick={() => onRestore(item._id || item.id, "consumed")}
                      >
                        Restore Item
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => onDelete(item._id || item.id, "consumed")}
                      >
                        Delete Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === "wasted" ? (
          <>
            {safeWastedItems.length === 0 ? (
              <div className="empty-state">
                <p>No wasted items to display</p>
              </div>
            ) : (
              <div className="removed-items-list">
                {safeWastedItems.map(item => (
                  <div className="removed-item" key={item._id || item.id}>
                    <div className="removed-item-details">
                      <span className="item-name">{item.name || "Unnamed item"}</span>
                      <span className="removed-date">Wasted on {formatDate(item.removedDate)}</span>
                    </div>
                    <div className="item-buttons">
                      <button 
                        className="restore-button"
                        onClick={() => onRestore(item._id || item.id, "wasted")}
                      >
                        Restore Item
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => onDelete(item._id || item.id, "wasted")}
                      >
                        Delete Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {safeDeletedItems.length === 0 ? (
              <div className="empty-state">
                <p>No deleted items to display</p>
              </div>
            ) : (
              <div className="removed-items-list">
                {safeDeletedItems.map(item => {
                  const itemId = item._id || item.id;
                  console.log(`Rendering deleted item: ${item.name} with ID: ${itemId}`);
                  return (
                    <div className="removed-item" key={itemId}>
                      <div className="removed-item-details">
                        <span className="item-name">{item.name || "Unnamed item"}</span>
                        <span className="removed-date">Deleted on {formatDate(item.removedDate)}</span>
                      </div>
                      <div className="item-buttons">
                        <button 
                          className="restore-button"
                          onClick={() => {
                            console.log(`Restoring deleted item with ID: ${itemId}`);
                            onRestore(itemId, "deleted");
                          }}
                        >
                          Restore Item
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => {
                            console.log(`Permanently deleting item with ID: ${itemId}`);
                            onDelete(itemId, "deleted");
                          }}
                        >
                          Permanently Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RemovedItems 