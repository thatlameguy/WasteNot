const fetch = require('node-fetch');

/**
 * Calculates food freshness using Groq AI API with an improved model
 * @param {Object} foodItem - The food item to calculate freshness for
 * @returns {Promise<{freshness: number, needsAlert: boolean, explanation: string, foodCategory: string}>} - Results including freshness percentage and alert status
 */
const calculateFreshnessWithGroq = async (foodItem) => {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (!GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found in environment variables, falling back to basic calculation');
      return calculateBasicFreshness(foodItem);
    }

    // Current date for calculations
    const today = new Date();
    
    // Calculate days owned
    const daysOwned = Math.floor((today - new Date(foodItem.addedDate)) / (1000 * 60 * 60 * 24));
    
    // Calculate days until expiry (can be negative if expired)
    const daysUntilExpiry = Math.floor((new Date(foodItem.expiryDate) - today) / (1000 * 60 * 60 * 24));

    // Determine if item is expiring today
    const isExpiringToday = daysUntilExpiry === 0;
    
    // Determine food category
    const foodCategory = determineFoodCategory(foodItem.name);
    
    // Flag critical combinations
    const criticalCombination = (isExpiringToday && foodItem.condition === "Near expiry") || 
                                (isExpiringToday && isDairyProduct(foodItem.name));

    // Build a detailed JSON prompt for Groq
    const promptData = {
      food_name: foodItem.name,
      food_category: foodCategory,
      storage_location: foodItem.storage,
      condition: foodItem.condition,
      shelf_life_days: foodItem.shelfLife,
      days_owned: daysOwned,
      days_until_expiry: daysUntilExpiry,
      is_expiring_today: isExpiringToday,
      is_critical_combination: criticalCombination,
      percentage_of_shelf_life_elapsed: foodItem.shelfLife > 0 ? 
        Math.min(100, Math.round((daysOwned / foodItem.shelfLife) * 100)) : 100
    };

    // Build the full prompt with instructions
    const prompt = `
      You are a professional food science expert specializing in food freshness assessment. 
      Analyze the following food item and provide a precise freshness percentage assessment
      and determine if this item needs an alert in the app's notification system.
      
      **FOOD ITEM DETAILS:**
      ${JSON.stringify(promptData, null, 2)}
      
      Return a detailed JSON response with these fields:
      1. "freshness": A number between 0-100 representing the freshness percentage
      2. "needs_alert": A boolean (true/false) indicating if this item should trigger an alert
      3. "explanation": A brief, user-friendly explanation of your assessment (max 100 characters)
      4. "food_category": The category you've determined for this food
      5. "decay_pattern": The decay pattern applicable to this food (e.g., "rapid", "standard", "slow")
      
      **CATEGORY-SPECIFIC ASSESSMENT GUIDELINES:**
      
      DAIRY (milk, yogurt, curd, cheese, cream):
      - Declines rapidly after opening (15-20% reduction in freshness)
      - Extremely sensitive to storage conditions
      - Refrigeration essential (reduce freshness by 60% if stored in pantry)
      - Once opened, 3-5 days shelf life typically
      - Near expiry state should reduce freshness by at least 25%
      
      PRODUCE (fruits, vegetables):
      - Varies significantly by type
      - Leafy greens decline rapidly (spinach, lettuce)
      - Hard fruits/vegetables decline more slowly (apples, potatoes)
      - Visual indicators strongly affect perceived freshness
      - "Near expiry" for produce means significant freshness loss (at least 40% reduction)
      
      MEAT & SEAFOOD:
      - Safety is paramount - conservative freshness assessments required
      - Must be frozen for extended storage
      - Rapid decline once thawed
      - If opened and not frozen, maximum 2-3 days shelf life
      - "Near expiry" should indicate substantial freshness loss (at least 50%)
      
      BAKED GOODS:
      - Shelf-stable but quality declines steadily
      - Store-bought baked goods with preservatives last longer
      - Freshness primarily about texture, not safety
      - Storage significantly impacts freshness (bread stays fresher in freezer)
      
      PANTRY ITEMS (rice, pasta, canned goods):
      - Very slow decline in freshness over time
      - Decline is usually about quality, not safety
      - "Best by" dates more flexible than "expiry" dates
      - When near expiry, still often 60%+ freshness
      
      **CRITICAL RULES (THESE MUST BE FOLLOWED):**
      - Items marked "Near expiry" AND expiring today: freshness MUST BE 30% OR LOWER
      - Dairy products expiring today: freshness MUST BE 40% OR LOWER
      - Any item expired (negative days until expiry): freshness MUST BE 20% OR LOWER
      - Items expiring today: freshness MAXIMUM 50%
      - Items marked "Near expiry": freshness MAXIMUM 60%
      - Items with "opened" condition: freshness SHOULD CONSIDER TIME SINCE OPENING
      
      **ALERT LOGIC RULES:**
      An item needs_alert set to TRUE if ANY of these apply:
      - Any item expiring today or already expired
      - Any item with freshness below 30%
      - Any dairy or meat item with freshness below 40%
      - Any item expiring within 3 days AND with freshness below 60%
      
      Focus on food science principles. Base your assessment on scientific understanding of food degradation patterns, 
      storage effects, and safety considerations. Your assessment should be balanced between food safety and quality considerations.
      
      Return ONLY a valid JSON object with the fields described above.
    `;

    // Set timeout to prevent long-hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a food science expert that calculates food freshness percentages based on scientific principles. Respond only with valid JSON including freshness percentage, alert status, explanation, food category, and decay pattern.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2, // Lower temperature for more consistent results
          max_tokens: 500,  // Increased to allow for more detailed response
          top_p: 0.95       // Slightly constrain responses for consistency
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Groq API error:', data);
        throw new Error(`Failed to calculate freshness with Groq API: ${data.error?.message || 'Unknown error'}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected Groq API response format:', data);
        throw new Error('Invalid response format from Groq API');
      }

      // Parse the JSON response
      const responseText = data.choices[0].message.content.trim();
      
      // Extract the JSON object from the response (in case there's any extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response:', responseText);
        throw new Error('Could not parse JSON from API response');
      }
      
      let resultObj;
      try {
        resultObj = JSON.parse(jsonMatch[0]);
        
        // Ensure we have the expected fields
        if (typeof resultObj.freshness !== 'number' || typeof resultObj.needs_alert !== 'boolean') {
          throw new Error('Missing required fields in response JSON');
        }
        
        // Ensure freshness is within valid range
        resultObj.freshness = Math.max(0, Math.min(100, Math.round(resultObj.freshness)));
        
        // Apply critical rules even to Groq responses as a failsafe
        if (isExpiringToday && foodItem.condition === "Near expiry") {
          resultObj.freshness = Math.min(resultObj.freshness, 30);
          resultObj.needs_alert = true;
          resultObj.explanation = resultObj.explanation || "Near expiry item expiring today";
        } else if (isExpiringToday && isDairyProduct(foodItem.name)) {
          resultObj.freshness = Math.min(resultObj.freshness, 40);
          resultObj.needs_alert = true;
        } else if (daysUntilExpiry < 0) {
          resultObj.freshness = Math.min(resultObj.freshness, 20);
          resultObj.needs_alert = true;
        } else if (isExpiringToday) {
          resultObj.freshness = Math.min(resultObj.freshness, 50);
          resultObj.needs_alert = true;
        } else if (foodItem.condition === "Near expiry") {
          resultObj.freshness = Math.min(resultObj.freshness, 60);
          resultObj.needs_alert = resultObj.needs_alert || daysUntilExpiry <= 3;
        }
        
        // Log successful freshness calculation
        console.log(`Groq freshness for ${foodItem.name} (${foodCategory}): ${resultObj.freshness}%, Alert: ${resultObj.needs_alert}, Reason: ${resultObj.explanation}`);
        
        return {
          freshness: resultObj.freshness,
          needsAlert: resultObj.needs_alert,
          explanation: resultObj.explanation || '',
          foodCategory: resultObj.food_category || foodCategory,
          decayPattern: resultObj.decay_pattern || 'standard'
        };
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError, responseText);
        throw new Error('Failed to parse valid JSON from API response');
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error calculating freshness with Groq:', error);
    return calculateBasicFreshness(foodItem);
  }
};

/**
 * Calculates a basic freshness score and alert status when the AI API is unavailable
 * @param {Object} foodItem - The food item to calculate freshness for
 * @returns {Object} - Results including freshness percentage and alert status
 */
const calculateBasicFreshness = (foodItem) => {
  // Current date for calculations
  const today = new Date();
  const expiryDate = new Date(foodItem.expiryDate);
  
  // Calculate days until expiry (can be negative if expired)
  const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
  const totalShelfLife = foodItem.shelfLife || 7; // Default to 7 days if not specified
  
  // Determine food category for specialized calculations
  const foodCategory = determineFoodCategory(foodItem.name);
  
  // Get decay rate based on food category
  const { decayRate, decayPattern, maxFreshness } = getFoodTypeParameters(foodCategory, foodItem.condition, foodItem.storage);
  
  // Basic freshness starting point
  let freshness;
  let explanation = '';
  let needsAlert = false;
  
  // Critical combination checks - these have precedence over all other calculations
  if (daysUntilExpiry === 0 && foodItem.condition === "Near expiry") {
    // "Near expiry" items that expire today should have very low freshness
    freshness = 30;
    explanation = 'Near expiry item expiring today';
    needsAlert = true;
  } else if (daysUntilExpiry === 0 && isDairyProduct(foodItem.name)) {
    // Dairy products that expire today
    freshness = 40;
    explanation = 'Dairy product expiring today';
    needsAlert = true;
  } else if (daysUntilExpiry < 0) {
    // Item is expired
    freshness = Math.max(0, Math.min(20, 20 + (daysUntilExpiry * decayRate)));
    explanation = 'Expired food';
    needsAlert = true;
  } else if (daysUntilExpiry === 0) {
    // Expiring today - cap at 50%
    freshness = Math.min(50, 50 + (totalShelfLife * 0.2));
    explanation = 'Expiring today';
    needsAlert = true;
  } else if (daysUntilExpiry >= totalShelfLife) {
    // Item is still very fresh
    freshness = maxFreshness;
    explanation = 'Very fresh';
    needsAlert = false;
  } else {
    // Item is within normal shelf life
    // Use an improved curve that declines more rapidly as expiry approaches
    // Higher exponent = steeper decline near expiry
    const remainingLifePercentage = daysUntilExpiry / totalShelfLife;
    
    if (decayPattern === 'exponential') {
      freshness = Math.round(maxFreshness * Math.pow(remainingLifePercentage, 1.5));
      explanation = 'Rapid decay pattern';
    } else if (decayPattern === 'slow') {
      freshness = Math.round(maxFreshness * Math.pow(remainingLifePercentage, 0.7));
      explanation = 'Slow decay pattern';
    } else {
      // Linear decay
      freshness = Math.round(maxFreshness * remainingLifePercentage);
      explanation = 'Standard decay pattern';
    }
    
    needsAlert = daysUntilExpiry <= 3 && freshness < 60;
  }
  
  // Apply condition modifier
  const conditionModifiers = {
    "Freshly bought": 10, // +10%
    "Near expiry": -30,   // -30%
    "Already opened": -25 // -25%
  };
  
  freshness += (conditionModifiers[foodItem.condition] || 0);
  
  // Apply storage modifier based on best storage practices
  const storageModifiers = {
    "Freezer": 10,   // +10%
    "Fridge": 0,     // No change
    "Pantry": -15    // -15%
  };
  
  freshness += (storageModifiers[foodItem.storage] || 0);
  
  // Apply category-specific logic
  if (foodCategory === 'dairy') {
    if (foodItem.condition === "Already opened") {
      freshness -= 15; // Additional -15% for opened dairy
      explanation = 'Opened dairy decays faster';
      needsAlert = needsAlert || freshness < 50;
    }
    
    if (foodItem.storage === "Pantry") {
      freshness -= 40; // Severe penalty for dairy in pantry
      explanation = 'Dairy needs refrigeration';
      needsAlert = true;
    }
  } else if (foodCategory === 'meat') {
    if (foodItem.condition === "Already opened" && foodItem.storage !== "Freezer") {
      freshness -= 35; // Significant penalty for opened meat not in freezer
      explanation = 'Opened meat decays quickly';
      needsAlert = true;
    }
    
    if (foodItem.storage === "Pantry") {
      freshness -= 50; // Severe penalty for meat in pantry
      explanation = 'Meat requires refrigeration';
      needsAlert = true;
    }
  } else if (foodCategory === 'produce') {
    if (foodItem.condition === "Already opened") {
      freshness -= 20; // Cut produce decays faster
      explanation = 'Cut produce spoils faster';
      needsAlert = needsAlert || daysUntilExpiry <= 2;
    }
  }
  
  // Apply caps and special rules:
  
  // 1. Cap items expiring today at 50%
  if (daysUntilExpiry === 0) {
    freshness = Math.min(freshness, 50);
    explanation = 'Expiring today';
    needsAlert = true;
  }
  
  // 2. Cap "Near expiry" items at 60% regardless of other factors
  if (foodItem.condition === "Near expiry") {
    freshness = Math.min(freshness, 60);
    explanation = 'Item marked as near expiry';
    needsAlert = needsAlert || daysUntilExpiry <= 3;
  }
  
  // 3. Cap opened items expiring within 2 days at 40%
  if (foodItem.condition === "Already opened" && daysUntilExpiry <= 2 && daysUntilExpiry >= 0) {
    freshness = Math.min(freshness, 40);
    explanation = 'Opened and expiring soon';
    needsAlert = true;
  }
  
  // 4. Any expired item capped at 20%
  if (daysUntilExpiry < 0) {
    freshness = Math.min(freshness, 20);
    explanation = 'Expired food';
    needsAlert = true;
  }
  
  // Ensure freshness is within 0-100 range
  freshness = Math.max(0, Math.min(100, Math.round(freshness)));
  
  // Double-check needsAlert flag
  needsAlert = needsAlert || 
    daysUntilExpiry === 0 ||                                // Expiring today
    daysUntilExpiry < 0 ||                                  // Already expired
    freshness < 30 ||                                       // Very low freshness
    (daysUntilExpiry <= 3 && freshness < 60);               // Expiring soon with declining freshness
  
  return {
    freshness,
    needsAlert,
    explanation: explanation.substring(0, 100), // Limit explanation length
    foodCategory,
    decayPattern
  };
};

/**
 * Helper function to check if a food item is a dairy product
 */
const isDairyProduct = (foodName) => {
  if (!foodName) return false;
  const dairyTerms = ["milk", "yogurt", "curd", "cheese", "cream", "butter", "dairy"];
  return dairyTerms.some(term => foodName.toLowerCase().includes(term));
};

/**
 * Helper function to check if a food item is a meat product
 */
const isMeatProduct = (foodName) => {
  if (!foodName) return false;
  const meatTerms = ["meat", "beef", "chicken", "pork", "fish", "lamb", "turkey", "seafood"];
  return meatTerms.some(term => foodName.toLowerCase().includes(term));
};

/**
 * Helper function to categorize a food item
 */
const determineFoodCategory = (foodName) => {
  if (!foodName) return 'other';
  
  foodName = foodName.toLowerCase();
  
  // Test for dairy products
  if (isDairyProduct(foodName)) {
    return 'dairy';
  }
  
  // Test for meat products
  if (isMeatProduct(foodName)) {
    return 'meat';
  }
  
  // Produce terms
  const produceTerms = ["apple", "banana", "orange", "tomato", "cucumber", "lettuce", 
                        "spinach", "kale", "carrot", "potato", "fruit", "vegetable", 
                        "salad", "greens", "broccoli", "cauliflower", "pepper", "onion",
                        "berry", "berries", "grapes"];
  if (produceTerms.some(term => foodName.includes(term))) {
    return 'produce';
  }
  
  // Baked goods
  const bakedTerms = ["bread", "cake", "pastry", "pie", "cookie", "muffin", "bun", 
                      "roll", "dough", "baked", "croissant", "bagel"];
  if (bakedTerms.some(term => foodName.includes(term))) {
    return 'baked';
  }
  
  // Pantry items
  const pantryTerms = ["rice", "pasta", "flour", "sugar", "cereal", "grain", 
                       "can", "canned", "dry", "dried", "packaged", "preserved"];
  if (pantryTerms.some(term => foodName.includes(term))) {
    return 'pantry';
  }
  
  // Default to other
  return 'other';
};

/**
 * Get food type-specific parameters for freshness calculation
 */
const getFoodTypeParameters = (category, condition, storage) => {
  // Default parameters
  let decayRate = 5;      // How fast freshness declines after expiry (higher = faster)
  let decayPattern = 'standard'; // linear, exponential, slow
  let maxFreshness = 100; // Maximum freshness for fresh items
  
  switch (category) {
    case 'dairy':
      decayRate = 8;
      decayPattern = 'exponential';
      maxFreshness = condition === 'Already opened' ? 85 : 100;
      break;
      
    case 'meat':
      decayRate = 10;
      decayPattern = 'exponential';
      maxFreshness = condition === 'Already opened' ? 80 : 100;
      break;
      
    case 'produce':
      decayRate = 7;
      decayPattern = 'standard';
      maxFreshness = 100;
      break;
      
    case 'baked':
      decayRate = 6;
      decayPattern = 'standard';
      maxFreshness = storage === 'Freezer' ? 95 : 100;
      break;
      
    case 'pantry':
      decayRate = 3;
      decayPattern = 'slow';
      maxFreshness = 100;
      break;
      
    default:
      // Default values for 'other' category
      decayRate = 5;
      decayPattern = 'standard';
      maxFreshness = 100;
  }
  
  // Apply condition modifier to decay pattern
  if (condition === 'Already opened') {
    // Opened items decay faster
    if (decayPattern === 'slow') decayPattern = 'standard';
    else if (decayPattern === 'standard') decayPattern = 'exponential';
  }
  
  // Freezer significantly slows decay for applicable categories
  if (storage === 'Freezer' && ['dairy', 'meat', 'baked'].includes(category)) {
    if (decayPattern === 'exponential') decayPattern = 'standard';
    else if (decayPattern === 'standard') decayPattern = 'slow';
    decayRate = Math.max(1, decayRate - 3); // Reduce decay rate, minimum 1
  }
  
  return { decayRate, decayPattern, maxFreshness };
};

module.exports = {
  calculateFreshnessWithGroq
}; 