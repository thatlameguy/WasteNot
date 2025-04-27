"use client"

import { useState, useEffect } from "react"
import { Loader } from "lucide-react"
import RecipeDetailModal from "./RecipeDetailModal"
import { API_URL } from "../utils/api"

const RecipeSuggestions = ({ items, onSaveRecipe }) => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Hardcode the API key directly - no UI for changing it
  const groqApiKey = "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"
  const [savedRecipes, setSavedRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  // Fetch recipes when component mounts or items change
  useEffect(() => {
    if (items.length > 0) {
      fetchRecipeSuggestions()
    }
  }, [items])

  const fetchRecipeSuggestions = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      // Make direct call to Groq API
      try {
        console.log("Calling Groq API...")
        const ingredients = items.map(item => item.name)
        
        const directResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              {
                role: "system",
                content: "You are a helpful cooking assistant that specializes in recommending recipes based on available ingredients."
              },
              {
                role: "user",
                content: `I have the following ingredients: ${ingredients.join(", ")}. Can you suggest 5 recipes that I can make with these ingredients? For each recipe, include the title, list of ingredients, cooking instructions, preparation time, and cooking time. Please ensure variety and creativity in the recipes. Current timestamp: ${Date.now()}. Format the response as JSON with the following structure: { "recipes": [{ "title": "Recipe Title", "ingredients": ["ingredient1", "ingredient2", ...], "instructions": "Step by step instructions", "prepTime": "X mins", "cookTime": "Y mins", "matchedIngredients": ["matched1", "matched2", ...] }] }`
              }
            ],
            temperature: 1.0,
            max_tokens: 4000,
            response_format: { type: "json_object" }
          })
        })
        
        const directData = await directResponse.json()
        
        if (!directResponse.ok) {
          throw new Error("API call failed")
        }
        
        // Parse the generated recipes
        const content = directData.choices[0].message.content
        const recipes = JSON.parse(content).recipes
        
        console.log("API call succeeded:", recipes)
        setSuggestions(recipes || [])
      } catch (directErr) {
        console.error("API call failed:", directErr)
        setError("Failed to get recipe suggestions. Please try again later.")
      }
    } catch (err) {
      console.error("Error fetching recipe suggestions:", err)
      setError(err.message || "Failed to get recipe suggestions")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRecipe = async (recipe) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(`${API_URL}/recipes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(recipe)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to save recipe")
      }

      // Mark recipe as saved
      setSavedRecipes([...savedRecipes, recipe.title])
      
      // Call parent component's onSaveRecipe if provided
      if (onSaveRecipe) {
        onSaveRecipe(data)
      }
      
      alert(`Recipe "${recipe.title}" saved successfully!`)
    } catch (err) {
      console.error("Error saving recipe:", err)
      alert(`Failed to save recipe: ${err.message}`)
    }
  }

  const openRecipeDetail = (recipe) => {
    setSelectedRecipe(recipe)
  }

  return (
    <div className="recipe-suggestions">
      <div className="card-header">
        <h2>Recipe Suggestions</h2>
        <button onClick={fetchRecipeSuggestions} className="refresh-button" disabled={loading}>
          {loading ? "Loading..." : "Refresh Recipes"}
        </button>
      </div>

      {loading ? (
        <div className="loading-recipes">
          <Loader className="spinner" />
          <p>Generating recipe suggestions...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchRecipeSuggestions} className="retry-button">
            Retry
          </button>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="no-suggestions">
          <p>Add food items to get recipe suggestions based on what you have.</p>
        </div>
      ) : (
        <div className="recipes-list">
          {suggestions.map((recipe, index) => (
            <div key={index} className="recipe-card">
              <h3>{recipe.title}</h3>
              
              <div className="recipe-meta">
                <span>Prep: {recipe.prepTime}</span>
                <span>Cook: {recipe.cookTime}</span>
              </div>
              
              <div className="matched-ingredients">
                <h4>Matched Ingredients:</h4>
                <div className="ingredients-chips">
                  {recipe.matchedIngredients?.map((ingredient, i) => (
                    <span key={i} className="ingredient-chip">{ingredient}</span>
                  )) || items.slice(0, 3).map((item, i) => (
                    <span key={i} className="ingredient-chip">{item.name}</span>
                  ))}
                </div>
              </div>
              
              <div className="recipe-actions">
                <button 
                  className="recipe-detail-button"
                  onClick={() => openRecipeDetail(recipe)}
                >
                  View Details
                </button>
                
                <button 
                  className={`save-recipe-button ${savedRecipes.includes(recipe.title) ? 'saved' : ''}`}
                  onClick={() => handleSaveRecipe(recipe)}
                  disabled={savedRecipes.includes(recipe.title)}
                >
                  {savedRecipes.includes(recipe.title) ? 'Saved' : 'Save Recipe'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </div>
  )
}

export default RecipeSuggestions
