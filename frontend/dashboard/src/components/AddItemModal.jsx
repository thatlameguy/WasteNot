"use client"

import { useState } from "react"
import { X, Calendar, AlertCircle } from "lucide-react"
import { API_URL } from "../utils/api"

const AddItemModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState("")
  const [storage, setStorage] = useState("Fridge")
  const [condition, setCondition] = useState("Freshly bought")
  const [expiryDate, setExpiryDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Set minimum expiry date to tomorrow
  const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Calculate shelf life based on expiry date input
  const calculateShelfLifeFromExpiryDate = (expiryDateStr) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = new Date(expiryDateStr)
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(1, diffDays) // Ensure minimum shelf life of 1 day
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    if (!name) {
      setError("Please enter a food name")
      setIsLoading(false)
      return
    }
    
    if (!expiryDate) {
      setError("Please select an expiry date")
      setIsLoading(false)
      return
    }
    
    try {
      // Calculate shelf life based on user-provided expiry date
      const shelfLife = calculateShelfLifeFromExpiryDate(expiryDate)
      
      // Create the item data
      const itemData = {
        name,
        storage,
        condition,
        expiryDate: new Date(expiryDate).toISOString(),
        shelfLife: shelfLife,
        freshness: 100,
        addedDate: new Date().toISOString() // Add current date as added date
      }
      
      console.log("Sending item data:", itemData)
      
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("You must be logged in to add items")
      }
      
      // Send the request to the server
      const response = await fetch(`${API_URL}/food-items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(itemData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to add item")
      }
      
      console.log("Item added successfully:", data)
      
      // Call the onAdd function to update the state
      onAdd(data)
      
      // Close the modal
      onClose()
    } catch (err) {
      console.error("Error adding item:", err)
      setError(err.message || "Failed to add item")
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add New Food Item</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="food-name">Food Name</label>
            <input
              type="text"
              id="food-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Milk, Eggs, Bread"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="storage">Storage Location</label>
            <select
              id="storage"
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
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
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="Freshly bought">Freshly bought</option>
              <option value="Near expiry">Near expiry</option>
              <option value="Already opened">Already opened</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="expiry-date">Expiry Date</label>
            <input
              type="date"
              id="expiry-date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={getTomorrow()}
              required
            />
            <div className="field-help">
              Enter the expiry date shown on the packaging
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !name || !expiryDate}
            >
              {isLoading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddItemModal
