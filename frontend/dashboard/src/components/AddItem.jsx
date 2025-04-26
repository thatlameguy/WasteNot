"use client"

import { Camera, FileText } from "lucide-react"

function AddItem({ onAddClick }) {
  return (
    <div className="card">
      <h2>Add Item</h2>

      <div className="add-options">
        <div className="add-option" onClick={onAddClick}>
          <div className="icon-container">
            <Camera size={24} />
          </div>
          <span>Scan Receipt</span>
        </div>

        <div className="add-option" onClick={onAddClick}>
          <div className="icon-container">
            <FileText size={24} />
          </div>
          <span>Manual Entry</span>
        </div>
      </div>
    </div>
  )
}

export default AddItem
