// Guest Data Service - Manages all guest data in localStorage
class GuestDataService {
  constructor() {
    this.storageKey = 'wastenot_guest_data';
    this.initializeGuestData();
  }

  // Initialize with sample data if not exists
  initializeGuestData() {
    if (!this.getGuestData()) {
      const sampleData = {
        user: {
          id: 'guest_user',
          name: 'Guest User',
          email: 'guest@wastenot.app',
          avatarId: 1,
          avatar: null,
          isGuest: true
        },
        foodItems: [
          {
            id: 'guest_1',
            name: 'Fresh Milk',
            expiryDate: this.getDateString(3), // 3 days from now
            storage: 'fridge',
            condition: 'fresh',
            addedDate: this.getDateString(0),
            shelfLife: 7,
            freshness: 85,
            freshnessReason: 'Fresh milk, good condition',
            status: 'active'
          },
          {
            id: 'guest_2',
            name: 'Bananas',
            expiryDate: this.getDateString(2), // 2 days from now
            storage: 'pantry',
            condition: 'fresh',
            addedDate: this.getDateString(0),
            shelfLife: 5,
            freshness: 70,
            freshnessReason: 'Slightly overripe but still good',
            status: 'active'
          },
          {
            id: 'guest_3',
            name: 'Ground Beef',
            expiryDate: this.getDateString(1), // 1 day from now
            storage: 'fridge',
            condition: 'fresh',
            addedDate: this.getDateString(0),
            shelfLife: 3,
            freshness: 60,
            freshnessReason: 'Use soon, approaching expiry',
            status: 'active'
          },
          {
            id: 'guest_4',
            name: 'Apples',
            expiryDate: this.getDateString(5), // 5 days from now
            storage: 'pantry',
            condition: 'fresh',
            addedDate: this.getDateString(-2),
            shelfLife: 14,
            freshness: 90,
            freshnessReason: 'Fresh and crisp',
            status: 'active'
          },
          {
            id: 'guest_5',
            name: 'Yogurt',
            expiryDate: this.getDateString(4), // 4 days from now
            storage: 'fridge',
            condition: 'fresh',
            addedDate: this.getDateString(0),
            shelfLife: 10,
            freshness: 95,
            freshnessReason: 'Fresh yogurt, perfect condition',
            status: 'active'
          }
        ],
        consumedItems: [
          {
            id: 'guest_consumed_1',
            name: 'Bread',
            expiryDate: this.getDateString(-1),
            storage: 'pantry',
            condition: 'fresh',
            addedDate: this.getDateString(-5),
            shelfLife: 7,
            freshness: 100,
            status: 'consumed',
            removedDate: this.getDateString(0)
          }
        ],
        wastedItems: [
          {
            id: 'guest_wasted_1',
            name: 'Lettuce',
            expiryDate: this.getDateString(-2),
            storage: 'fridge',
            condition: 'near-expiry',
            addedDate: this.getDateString(-7),
            shelfLife: 5,
            freshness: 0,
            status: 'wasted',
            removedDate: this.getDateString(0)
          }
        ],
        deletedItems: [],
        savedRecipes: [
          {
            id: 'guest_recipe_1',
            title: 'Banana Smoothie',
            ingredients: ['Bananas', 'Milk', 'Honey'],
            instructions: 'Blend all ingredients until smooth',
            prepTime: 5,
            cookTime: 0,
            matchedIngredients: ['Bananas', 'Milk'],
            savedAt: this.getDateString(-1)
          }
        ],
        alerts: [
          {
            id: 'guest_alert_1',
            foodItemId: 'guest_3',
            itemName: 'Ground Beef',
            expiryDate: this.getDateString(1),
            type: 'expiry',
            daysRemaining: 1,
            isRead: false,
            isCritical: true,
            freshness: 60,
            foodCategory: 'meat',
            alertReason: 'Expires tomorrow'
          }
        ],
        settings: {
          cardSizes: {},
          theme: 'dark',
          notifications: true
        }
      };
      this.saveGuestData(sampleData);
    }
  }

  // Helper function to get date string
  getDateString(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  // Get all guest data
  getGuestData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading guest data:', error);
      return null;
    }
  }

  // Save all guest data
  saveGuestData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving guest data:', error);
    }
  }

  // Get specific data type
  getData(type) {
    const data = this.getGuestData();
    return data ? data[type] || [] : [];
  }

  // Update specific data type
  updateData(type, newData) {
    const data = this.getGuestData();
    if (data) {
      data[type] = newData;
      this.saveGuestData(data);
    }
  }

  // Add new food item
  addFoodItem(item) {
    const items = this.getData('foodItems');
    const newItem = {
      ...item,
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedDate: this.getDateString(0),
      expiryDate: item.expiryDate instanceof Date ? item.expiryDate.toISOString().split('T')[0] : item.expiryDate,
      freshness: this.calculateFreshness(item),
      freshnessReason: this.getFreshnessReason(item)
    };
    items.push(newItem);
    this.updateData('foodItems', items);
    return newItem;
  }

  // Update food item
  updateFoodItem(id, updates) {
    const items = this.getData('foodItems');
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.updateData('foodItems', items);
      return items[index];
    }
    return null;
  }

  // Delete food item (move to deleted category)
  deleteFoodItem(id) {
    const items = this.getData('foodItems');
    const deletedItem = items.find(item => item.id === id);
    if (deletedItem) {
      const updatedItems = items.filter(item => item.id !== id);
      this.updateData('foodItems', updatedItems);
      
      // Add to deleted items
      const deletedItems = this.getData('deletedItems');
      deletedItems.push({ ...deletedItem, removedDate: this.getDateString(0) });
      this.updateData('deletedItems', deletedItems);
      
      return deletedItem;
    }
    return null;
  }

  // Permanently delete food item from any category
  permanentlyDeleteFoodItem(id) {
    // Check all categories for the item
    const consumedItems = this.getData('consumedItems');
    const wastedItems = this.getData('wastedItems');
    const deletedItems = this.getData('deletedItems');
    const activeItems = this.getData('foodItems');
    
    let deletedItem = null;
    
    // Find and remove from consumed items
    const consumedIndex = consumedItems.findIndex(item => item.id === id);
    if (consumedIndex !== -1) {
      deletedItem = consumedItems[consumedIndex];
      consumedItems.splice(consumedIndex, 1);
      this.updateData('consumedItems', consumedItems);
    }
    
    // Find and remove from wasted items
    const wastedIndex = wastedItems.findIndex(item => item.id === id);
    if (wastedIndex !== -1) {
      deletedItem = wastedItems[wastedIndex];
      wastedItems.splice(wastedIndex, 1);
      this.updateData('wastedItems', wastedItems);
    }
    
    // Find and remove from deleted items
    const deletedIndex = deletedItems.findIndex(item => item.id === id);
    if (deletedIndex !== -1) {
      deletedItem = deletedItems[deletedIndex];
      deletedItems.splice(deletedIndex, 1);
      this.updateData('deletedItems', deletedItems);
    }
    
    // Find and remove from active items
    const activeIndex = activeItems.findIndex(item => item.id === id);
    if (activeIndex !== -1) {
      deletedItem = activeItems[activeIndex];
      activeItems.splice(activeIndex, 1);
      this.updateData('foodItems', activeItems);
    }
    
    return deletedItem;
  }

  // Update item status (consume, waste, etc.)
  updateItemStatus(id, status) {
    const items = this.getData('foodItems');
    const item = items.find(item => item.id === id);
    if (item) {
      // Remove from active items
      const updatedItems = items.filter(item => item.id !== id);
      this.updateData('foodItems', updatedItems);
      
      // Add to appropriate category
      const updatedItem = { ...item, status, removedDate: this.getDateString(0) };
      if (status === 'consumed') {
        const consumedItems = this.getData('consumedItems');
        consumedItems.push(updatedItem);
        this.updateData('consumedItems', consumedItems);
      } else if (status === 'wasted') {
        const wastedItems = this.getData('wastedItems');
        wastedItems.push(updatedItem);
        this.updateData('wastedItems', wastedItems);
      } else if (status === 'deleted') {
        const deletedItems = this.getData('deletedItems');
        deletedItems.push(updatedItem);
        this.updateData('deletedItems', deletedItems);
      }
      
      return updatedItem;
    }
    return null;
  }

  // Restore item
  restoreItem(id) {
    const consumedItems = this.getData('consumedItems');
    const wastedItems = this.getData('wastedItems');
    const deletedItems = this.getData('deletedItems');
    
    let item = consumedItems.find(item => item.id === id) ||
               wastedItems.find(item => item.id === id) ||
               deletedItems.find(item => item.id === id);
    
    if (item) {
      // Remove from current category
      if (consumedItems.find(i => i.id === id)) {
        this.updateData('consumedItems', consumedItems.filter(i => i.id !== id));
      } else if (wastedItems.find(i => i.id === id)) {
        this.updateData('wastedItems', wastedItems.filter(i => i.id !== id));
      } else if (deletedItems.find(i => i.id === id)) {
        this.updateData('deletedItems', deletedItems.filter(i => i.id !== id));
      }
      
      // Add back to active items
      const activeItems = this.getData('foodItems');
      const restoredItem = { ...item, status: 'active', removedDate: null };
      activeItems.push(restoredItem);
      this.updateData('foodItems', activeItems);
      
      return restoredItem;
    }
    return null;
  }

  // Save recipe
  saveRecipe(recipe) {
    const recipes = this.getData('savedRecipes');
    const newRecipe = {
      ...recipe,
      id: `guest_recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      savedAt: this.getDateString(0)
    };
    recipes.push(newRecipe);
    this.updateData('savedRecipes', recipes);
    return newRecipe;
  }

  // Delete recipe
  deleteRecipe(id) {
    const recipes = this.getData('savedRecipes');
    const updatedRecipes = recipes.filter(recipe => recipe.id !== id);
    this.updateData('savedRecipes', updatedRecipes);
  }

  // Generate alerts
  generateAlerts() {
    const items = this.getData('foodItems');
    const today = new Date();
    const alerts = [];
    
    items.forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 3) {
        alerts.push({
          id: `guest_alert_${item.id}`,
          foodItemId: item.id,
          itemName: item.name,
          expiryDate: item.expiryDate,
          type: 'expiry',
          daysRemaining,
          isRead: false,
          isCritical: daysRemaining <= 1,
          freshness: item.freshness,
          foodCategory: this.getFoodCategory(item.name),
          alertReason: daysRemaining <= 0 ? 'Expired' : 
                      daysRemaining === 1 ? 'Expires tomorrow' : 
                      `Expires in ${daysRemaining} days`
        });
      }
    });
    
    this.updateData('alerts', alerts);
    return alerts;
  }

  // Calculate freshness (simplified version)
  calculateFreshness(item) {
    const today = new Date();
    const expiryDate = new Date(item.expiryDate);
    const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) return 0;
    if (daysRemaining >= item.shelfLife) return 100;
    
    return Math.max(0, Math.min(100, (daysRemaining / item.shelfLife) * 100));
  }

  // Get freshness reason
  getFreshnessReason(item) {
    const freshness = this.calculateFreshness(item);
    if (freshness >= 80) return 'Fresh and in excellent condition';
    if (freshness >= 60) return 'Good condition, use soon';
    if (freshness >= 40) return 'Approaching expiry, use today';
    if (freshness >= 20) return 'Near expiry, use immediately';
    return 'Expired or very close to expiry';
  }

  // Get food category
  getFoodCategory(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt')) {
      return 'dairy';
    }
    if (lowerName.includes('beef') || lowerName.includes('chicken') || lowerName.includes('pork')) {
      return 'meat';
    }
    if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('orange')) {
      return 'fruit';
    }
    if (lowerName.includes('lettuce') || lowerName.includes('spinach') || lowerName.includes('carrot')) {
      return 'vegetable';
    }
    return 'other';
  }

  // Clear all guest data
  clearGuestData() {
    localStorage.removeItem(this.storageKey);
  }

  // Export guest data (for when they want to sign up)
  exportGuestData() {
    return this.getGuestData();
  }
}

export default new GuestDataService();
