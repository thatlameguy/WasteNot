"use client"

import { useState, useEffect } from "react"
import { Loader, Trash2 } from "lucide-react"
import RecipeDetailModal from "./RecipeDetailModal"
import { API_URL } from "../utils/api"

function SavedRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [groqApiKey, setGroqApiKey] = useState(localStorage.getItem("groqApiKey") || "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")

  useEffect(() => {
    fetchSavedRecipes()
  }, [])

  const fetchSavedRecipes = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(`${API_URL}/recipes`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch saved recipes")
      }

      setRecipes(data)
    } catch (err) {
      console.error("Error fetching saved recipes:", err)
      setError(err.message || "Failed to load saved recipes")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete recipe")
      }

      // Update recipes list
      setRecipes(recipes.filter(recipe => recipe._id !== recipeId))
    } catch (err) {
      console.error("Error deleting recipe:", err)
      alert(`Failed to delete recipe: ${err.message}`)
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

  // Open recipe detail modal
  const openRecipeDetail = (recipe) => {
    setSelectedRecipe(recipe)
  }

  // Close recipe detail modal
  const closeRecipeDetail = () => {
    setSelectedRecipe(null)
  }

  const triggerAlertGeneration = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
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
      
      // Refresh alerts list
      fetchSavedRecipes();
    } catch (err) {
      console.error("Error generating alerts:", err);
      alert(`Failed to generate alerts: ${err.message}`);
    }
  };

  return (
    <div className="saved-recipes-container">
      <div className="saved-recipes-header">
        <h2>Your Saved Recipes</h2>
        <button onClick={fetchSavedRecipes} className="refresh-button" disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-recipes">
          <Loader className="spinner" />
          <p>Loading your saved recipes...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSavedRecipes} className="retry-button">
            Retry
          </button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="no-recipes">
          <p>You haven't saved any recipes yet.</p>
          <p>Check out the Recipe Suggestions to find recipes you can make with your food items.</p>
        </div>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <div key={recipe._id} className="saved-recipe-card">
              <div className="recipe-header">
                <h3>{recipe.title}</h3>
                <button 
                  className="delete-recipe-button"
                  onClick={() => handleDeleteRecipe(recipe._id)}
                  aria-label="Delete recipe"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="recipe-meta">
                <span>Prep: {recipe.prepTime}</span>
                <span>Cook: {recipe.cookTime}</span>
                <span className="save-date">Saved on: {formatDate(recipe.savedAt)}</span>
              </div>
              
              <div className="matched-ingredients">
                <h4>Ingredients:</h4>
                <div className="ingredients-list">
                  {recipe.ingredients.slice(0, 5).map((ingredient, i) => (
                    <span key={i} className="ingredient-item">{ingredient}</span>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <span className="more-ingredients">+ {recipe.ingredients.length - 5} more</span>
                  )}
                </div>
              </div>
              
              <button 
                className="view-recipe-button"
                onClick={() => openRecipeDetail(recipe)}
              >
                View Full Recipe
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal 
          recipe={selectedRecipe} 
          onClose={closeRecipeDetail} 
        />
      )}
    </div>
  )
}

export default SavedRecipes 