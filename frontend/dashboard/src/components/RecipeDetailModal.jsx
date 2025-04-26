"use client"

import { X } from "lucide-react"

function RecipeDetailModal({ recipe, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal recipe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe.title || recipe.name}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="recipe-modal-content">
          <div className="recipe-time-info">
            <div className="time-info">
              <span className="info-label">Prep Time:</span>
              <span className="info-value">{recipe.prepTime}</span>
            </div>
            <div className="time-info">
              <span className="info-label">Cook Time:</span>
              <span className="info-value">{recipe.cookTime}</span>
            </div>
          </div>
          
          <div className="recipe-ingredients">
            <h3>Ingredients</h3>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">{ingredient}</li>
              ))}
            </ul>
          </div>
          
          <div className="recipe-instructions">
            <h3>Instructions</h3>
            <div className="instructions-content">
              {recipe.instructions}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetailModal 