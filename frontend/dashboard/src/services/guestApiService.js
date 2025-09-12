// Guest API Service - Mimics the real API but uses local storage
import guestDataService from './guestDataService';

class GuestApiService {
  // Simulate API delay
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Food Items API
  async getFoodItems() {
    await this.delay();
    return guestDataService.getData('foodItems');
  }

  async getConsumedItems() {
    await this.delay();
    return guestDataService.getData('consumedItems');
  }

  async getWastedItems() {
    await this.delay();
    return guestDataService.getData('wastedItems');
  }

  async getDeletedItems() {
    await this.delay();
    return guestDataService.getData('deletedItems');
  }

  async addFoodItem(itemData) {
    await this.delay();
    const newItem = guestDataService.addFoodItem(itemData);
    return { success: true, item: newItem };
  }

  async updateFoodItem(id, updates) {
    await this.delay();
    const updatedItem = guestDataService.updateFoodItem(id, updates);
    return { success: true, item: updatedItem };
  }

  async deleteFoodItem(id) {
    await this.delay();
    const deletedItem = guestDataService.deleteFoodItem(id);
    return { success: true, item: deletedItem };
  }

  async permanentlyDeleteFoodItem(id) {
    await this.delay();
    const deletedItem = guestDataService.permanentlyDeleteFoodItem(id);
    return { success: true, item: deletedItem };
  }

  async updateFoodItemStatus(id, status) {
    await this.delay();
    const updatedItem = guestDataService.updateItemStatus(id, status);
    return { success: true, item: updatedItem };
  }

  async restoreFoodItem(id) {
    await this.delay();
    const restoredItem = guestDataService.restoreItem(id);
    return { success: true, item: restoredItem };
  }

  async calculateFreshness(id) {
    await this.delay();
    const items = guestDataService.getData('foodItems');
    const item = items.find(item => item.id === id);
    if (item) {
      const freshness = guestDataService.calculateFreshness(item);
      const updatedItem = guestDataService.updateFoodItem(id, { 
        freshness, 
        freshnessReason: guestDataService.getFreshnessReason(item) 
      });
      return { success: true, item: updatedItem };
    }
    return { success: false, error: 'Item not found' };
  }

  // Recipes API
  async getRecipes() {
    await this.delay();
    return guestDataService.getData('savedRecipes');
  }

  async saveRecipe(recipeData) {
    await this.delay();
    const newRecipe = guestDataService.saveRecipe(recipeData);
    return { success: true, recipe: newRecipe };
  }

  async deleteRecipe(id) {
    await this.delay();
    guestDataService.deleteRecipe(id);
    return { success: true };
  }

  // Alerts API
  async getAlerts() {
    await this.delay();
    return guestDataService.getData('alerts');
  }

  async generateAlerts() {
    await this.delay();
    const alerts = guestDataService.generateAlerts();
    return { success: true, alerts };
  }

  async markAlertAsRead(id) {
    await this.delay();
    const alerts = guestDataService.getData('alerts');
    const alert = alerts.find(alert => alert.id === id);
    if (alert) {
      alert.isRead = true;
      guestDataService.updateData('alerts', alerts);
    }
    return { success: true };
  }

  async clearAllAlerts() {
    await this.delay();
    guestDataService.updateData('alerts', []);
    return { success: true };
  }

  // User API
  async getUserProfile() {
    await this.delay();
    return guestDataService.getData('user');
  }

  async updateUserProfile(updates) {
    await this.delay();
    const user = guestDataService.getData('user');
    const updatedUser = { ...user, ...updates };
    guestDataService.updateData('user', updatedUser);
    return { success: true, user: updatedUser };
  }

  // Recipe Suggestions (simplified)
  async getRecipeSuggestions(ingredients) {
    await this.delay(500); // Simulate AI processing time
    
    // Generate simple recipe suggestions based on ingredients
    const suggestions = [
      {
        title: `${ingredients[0]} Smoothie`,
        ingredients: ingredients.slice(0, 3),
        instructions: `Blend ${ingredients.slice(0, 3).join(', ')} with some liquid until smooth.`,
        prepTime: 5,
        cookTime: 0,
        matchedIngredients: ingredients.slice(0, 3)
      },
      {
        title: `${ingredients[0]} Salad`,
        ingredients: [...ingredients, 'Lettuce', 'Dressing'],
        instructions: `Chop all ingredients and mix with your favorite dressing.`,
        prepTime: 10,
        cookTime: 0,
        matchedIngredients: ingredients.slice(0, 2)
      }
    ];
    
    return { success: true, suggestions };
  }
}

export default new GuestApiService();
