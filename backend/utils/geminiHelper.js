const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use currently supported models - gemini-1.5-flash is fastest and free
// Can be overridden with GEMINI_MODEL env var
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
// Models to try as fallback if primary fails (in order of preference)
const FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-pro', 'gemini-pro'];
// Use v1 API (not v1beta) for better model support
const API_VERSION = 'v1';
const BASE_URL = `https://generativelanguage.googleapis.com/${API_VERSION}/models`;

/**
 * Attempts to repair incomplete JSON by closing unclosed brackets/braces
 */
function repairIncompleteJSON(jsonString) {
	try {
		// Count open/close brackets and braces
		let openBraces = (jsonString.match(/\{/g) || []).length;
		let closeBraces = (jsonString.match(/\}/g) || []).length;
		let openBrackets = (jsonString.match(/\[/g) || []).length;
		let closeBrackets = (jsonString.match(/\]/g) || []).length;

		// Remove trailing commas before closing brackets/braces
		jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

		// Close unclosed brackets/braces
		while (openBrackets > closeBrackets) {
			jsonString += ']';
			closeBrackets++;
		}
		while (openBraces > closeBraces) {
			jsonString += '}';
			closeBraces++;
		}

		return jsonString;
	} catch (error) {
		return jsonString; // Return original if repair fails
	}
}

/**
 * Safely extracts and validates JSON from text response
 * Handles cases where Gemini returns extra text, markdown code blocks, or incomplete JSON
 */
function extractAndValidateJSON(text) {
	if (!text || typeof text !== 'string') {
		console.error('❌ Invalid text input for JSON extraction');
		return null;
	}

	// Remove markdown code blocks if present
	let cleanedText = text.trim();
	if (cleanedText.startsWith('```json')) {
		cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
	} else if (cleanedText.startsWith('```')) {
		cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
	}

	// Try direct JSON parse first
	try {
		const json = JSON.parse(cleanedText);
		console.log('✅ Direct JSON parse successful');
		return json;
	} catch (parseError) {
		console.log('⚠️ Direct parse failed, attempting to extract and repair JSON...');
		console.log(`Parse error: ${parseError.message}`);
	}

	// Try to find JSON object in text (handles cases with extra text)
	const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		let jsonString = jsonMatch[0];
		
		// First try parsing as-is
		try {
			const json = JSON.parse(jsonString);
			console.log('✅ Extracted and parsed JSON successfully');
			return json;
		} catch (extractError) {
			console.log(`⚠️ First extraction attempt failed: ${extractError.message}`);
			console.log(`JSON length: ${jsonString.length} chars`);
			console.log(`Error position: ${extractError.message.match(/position (\d+)/)?.[1] || 'unknown'}`);
			
			// Try to repair incomplete JSON
			try {
				const repaired = repairIncompleteJSON(jsonString);
				const json = JSON.parse(repaired);
				console.log('✅ Repaired and parsed incomplete JSON successfully');
				return json;
			} catch (repairError) {
				console.error('❌ Failed to repair and parse JSON:', repairError.message);
				
				// Log the problematic section
				const errorPos = parseInt(repairError.message.match(/position (\d+)/)?.[1] || '0');
				const start = Math.max(0, errorPos - 100);
				const end = Math.min(jsonString.length, errorPos + 100);
				console.error('Problematic section:', jsonString.substring(start, end));
				console.error('Full JSON (first 1000 chars):', jsonString.substring(0, 1000));
			}
		}
	}

	console.error('❌ No valid JSON found in response');
	console.error('Response text (first 1000 chars):', text.substring(0, 1000));
	return null;
}

/**
 * Validates that the parsed JSON has the expected structure
 */
function validateJSONStructure(json, expectedKeys = []) {
	if (!json || typeof json !== 'object') {
		console.error('❌ JSON validation failed: not an object');
		return false;
	}

	if (expectedKeys.length > 0) {
		const missingKeys = expectedKeys.filter(key => !(key in json));
		if (missingKeys.length > 0) {
			console.error(`❌ JSON validation failed: missing keys: ${missingKeys.join(', ')}`);
			return false;
		}
	}

	console.log('✅ JSON structure validation passed');
	return true;
}

/**
 * Calls Gemini API with automatic model fallback and robust JSON parsing
 */
async function callGeminiJSON(prompt, { temperature = 0.3, maxOutputTokens = 2048, expectedKeys = [] } = {}) {
	if (!GEMINI_API_KEY) {
		console.error('❌ GEMINI_API_KEY is missing from environment variables');
		throw new Error('GEMINI_API_KEY missing');
	}

	// Build request body with strict JSON instruction
	// Note: responseMimeType is not supported in v1 API, so we rely on prompt instructions
	const body = {
		contents: [
			{
				parts: [{ text: prompt }]
			}
		],
		generationConfig: {
			temperature,
			maxOutputTokens
			// responseMimeType is not available in v1 API - JSON format is enforced via prompt
		}
	};

	// Try models in order until one works
	const modelsToTry = [GEMINI_MODEL, ...FALLBACK_MODELS.filter(m => m !== GEMINI_MODEL)];
	let lastError = null;

	for (let i = 0; i < modelsToTry.length; i++) {
		const model = modelsToTry[i];
		const isLastModel = i === modelsToTry.length - 1;

		try {
			const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
			
			console.log(`\n🔄 [Attempt ${i + 1}/${modelsToTry.length}] Trying Gemini API with model: ${model}`);
			console.log(`📍 Endpoint: ${API_VERSION}/models/${model}:generateContent`);

			// Set timeout using AbortController
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			let res;
			try {
				res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
					signal: controller.signal
				});
			} finally {
				clearTimeout(timeoutId);
			}

			// Parse response
			let data;
			try {
				data = await res.json();
			} catch (jsonError) {
				console.error('❌ Failed to parse API response as JSON:', jsonError.message);
				throw new Error(`Invalid JSON response from Gemini API: ${res.status} ${res.statusText}`);
			}
			
			// Handle API errors
			if (!res.ok) {
				// If it's a 404 (model not found), try next model
				if (res.status === 404 && !isLastModel) {
					console.log(`⚠️ Model ${model} not found (404), trying next model...`);
					lastError = new Error(`Model ${model} not found`);
					continue;
				}
				console.error('❌ Gemini API error response:', JSON.stringify(data, null, 2));
				const errorMsg = data?.error?.message || data?.error?.status || `HTTP ${res.status}`;
				throw new Error(`Gemini API error: ${errorMsg}`);
			}

			// Validate response structure
			if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
				console.error('❌ Unexpected Gemini response structure:', JSON.stringify(data, null, 2));
				throw new Error('Invalid response structure from Gemini API');
			}

			const text = data.candidates[0].content.parts?.[0]?.text || '';
			console.log(`✅ Successfully received response from model: ${model}`);
			console.log(`📝 Response length: ${text.length} characters`);
			console.log(`📄 Response preview (first 200 chars): ${text.substring(0, 200)}...`);

			// Extract and validate JSON
			const json = extractAndValidateJSON(text);
			if (!json) {
				throw new Error('Failed to extract valid JSON from Gemini response');
			}

			// Validate JSON structure if expected keys provided
			if (expectedKeys.length > 0) {
				if (!validateJSONStructure(json, expectedKeys)) {
					throw new Error(`JSON structure validation failed. Expected keys: ${expectedKeys.join(', ')}`);
				}
			}

			console.log(`✅ Successfully parsed and validated JSON from model: ${model}`);
			console.log(`🎯 JSON keys found: ${Object.keys(json).join(', ')}`);
			return json;

		} catch (error) {
			if (error.name === 'AbortError') {
				console.error('⏱️ Gemini API request timed out after 30 seconds');
				if (isLastModel) {
					throw new Error('Gemini API request timed out');
				}
				lastError = new Error('Request timed out');
				continue;
			}

			// If this is the last model, throw the error
			if (isLastModel) {
				console.error(`❌ All models failed. Last error: ${error.message}`);
				throw error;
			}

			// Otherwise, save error and try next model
			lastError = error;
			console.log(`⚠️ Model ${model} failed: ${error.message}`);
			console.log(`🔄 Trying next model...`);
		}
	}

	// If we get here, all models failed
	throw lastError || new Error('All Gemini models failed');
}

// Helper functions for food categorization
const isDairyProduct = (name = '') => ['milk','yogurt','curd','cheese','cream','butter','dairy'].some(t => name.toLowerCase().includes(t));
const isMeatProduct = (name = '') => ['meat','beef','chicken','pork','fish','lamb','turkey','seafood'].some(t => name.toLowerCase().includes(t));

function determineFoodCategory(name = '') {
	const n = name.toLowerCase();
	if (isDairyProduct(n)) return 'dairy';
	if (isMeatProduct(n)) return 'meat';
	if (['apple','banana','orange','tomato','cucumber','lettuce','spinach','kale','carrot','potato','fruit','vegetable','salad','greens','broccoli','cauliflower','pepper','onion','berry','berries','grapes'].some(t => n.includes(t))) return 'produce';
	if (['bread','cake','pastry','pie','cookie','muffin','bun','roll','dough','baked','croissant','bagel'].some(t => n.includes(t))) return 'baked';
	if (['rice','pasta','flour','sugar','cereal','grain','can','canned','dry','dried','packaged','preserved'].some(t => n.includes(t))) return 'pantry';
	return 'other';
}

function getFoodTypeParameters(category, condition, storage) {
	let decayRate = 5, decayPattern = 'standard', maxFreshness = 100;
	switch (category) {
		case 'dairy':   decayRate = 8;  decayPattern = 'exponential'; maxFreshness = condition === 'Already opened' ? 85 : 100; break;
		case 'meat':    decayRate = 10; decayPattern = 'exponential'; maxFreshness = condition === 'Already opened' ? 80 : 100; break;
		case 'produce': decayRate = 7;  decayPattern = 'standard';    maxFreshness = 100; break;
		case 'baked':   decayRate = 6;  decayPattern = 'standard';    maxFreshness = storage === 'Freezer' ? 95 : 100; break;
		case 'pantry':  decayRate = 3;  decayPattern = 'slow';        maxFreshness = 100; break;
	}
	if (condition === 'Already opened') {
		if (decayPattern === 'slow') decayPattern = 'standard';
		else if (decayPattern === 'standard') decayPattern = 'exponential';
	}
	if (storage === 'Freezer' && ['dairy','meat','baked'].includes(category)) {
		if (decayPattern === 'exponential') decayPattern = 'standard';
		else if (decayPattern === 'standard') decayPattern = 'slow';
		decayRate = Math.max(1, decayRate - 3);
	}
	return { decayRate, decayPattern, maxFreshness };
}

function calculateBasicFreshness(foodItem) {
	const today = new Date();
	const expiryDate = new Date(foodItem.expiryDate);
	const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
	const totalShelfLife = foodItem.shelfLife || 7;
	const foodCategory = determineFoodCategory(foodItem.name);
	const { decayRate, decayPattern, maxFreshness } = getFoodTypeParameters(foodCategory, foodItem.condition, foodItem.storage);

	let freshness, explanation = '', needsAlert = false;

	if (daysUntilExpiry === 0 && foodItem.condition === 'Near expiry') {
		freshness = 30; explanation = 'Near expiry item expiring today'; needsAlert = true;
	} else if (daysUntilExpiry === 0 && isDairyProduct(foodItem.name)) {
		freshness = 40; explanation = 'Dairy product expiring today'; needsAlert = true;
	} else if (daysUntilExpiry < 0) {
		freshness = Math.max(0, Math.min(20, 20 + (daysUntilExpiry * decayRate)));
		explanation = 'Expired food'; needsAlert = true;
	} else if (daysUntilExpiry === 0) {
		freshness = Math.min(50, 50 + (totalShelfLife * 0.2));
		explanation = 'Expiring today'; needsAlert = true;
	} else if (daysUntilExpiry >= totalShelfLife) {
		freshness = maxFreshness; explanation = 'Very fresh'; needsAlert = false;
	} else {
		const remaining = daysUntilExpiry / totalShelfLife;
		if (decayPattern === 'exponential') { freshness = Math.round(maxFreshness * Math.pow(remaining, 1.5)); explanation = 'Rapid decay pattern'; }
		else if (decayPattern === 'slow')    { freshness = Math.round(maxFreshness * Math.pow(remaining, 0.7)); explanation = 'Slow decay pattern'; }
		else                                 { freshness = Math.round(maxFreshness * remaining);                explanation = 'Standard decay pattern'; }
		needsAlert = daysUntilExpiry <= 3 && freshness < 60;
	}

	const conditionModifiers = { 'Freshly bought': 10, 'Near expiry': -30, 'Already opened': -25 };
	freshness += (conditionModifiers[foodItem.condition] || 0);

	const storageModifiers = { 'Freezer': 10, 'Fridge': 0, 'Pantry': -15 };
	freshness += (storageModifiers[foodItem.storage] || 0);

	const category = foodCategory;
	if (category === 'dairy') {
		if (foodItem.condition === 'Already opened') { freshness -= 15; explanation = 'Opened dairy decays faster'; needsAlert = needsAlert || freshness < 50; }
		if (foodItem.storage === 'Pantry')          { freshness -= 40; explanation = 'Dairy needs refrigeration'; needsAlert = true; }
	} else if (category === 'meat') {
		if (foodItem.condition === 'Already opened' && foodItem.storage !== 'Freezer') { freshness -= 35; explanation = 'Opened meat decays quickly'; needsAlert = true; }
		if (foodItem.storage === 'Pantry')                                            { freshness -= 50; explanation = 'Meat requires refrigeration'; needsAlert = true; }
	} else if (category === 'produce') {
		if (foodItem.condition === 'Already opened') { freshness -= 20; explanation = 'Cut produce spoils faster'; needsAlert = needsAlert || daysUntilExpiry <= 2; }
	}

	if (daysUntilExpiry === 0) { freshness = Math.min(freshness, 50); explanation = 'Expiring today'; needsAlert = true; }
	if (foodItem.condition === 'Near expiry') { freshness = Math.min(freshness, 60); explanation = 'Item marked as near expiry'; needsAlert = needsAlert || daysUntilExpiry <= 3; }
	if (foodItem.condition === 'Already opened' && daysUntilExpiry <= 2 && daysUntilExpiry >= 0) { freshness = Math.min(freshness, 40); explanation = 'Opened and expiring soon'; needsAlert = true; }
	if (daysUntilExpiry < 0) { freshness = Math.min(freshness, 20); explanation = 'Expired food'; needsAlert = true; }

	freshness = Math.max(0, Math.min(100, Math.round(freshness)));
	needsAlert = needsAlert || daysUntilExpiry === 0 || daysUntilExpiry < 0 || freshness < 30 || (daysUntilExpiry <= 3 && freshness < 60);

	return { freshness, needsAlert, explanation: explanation.substring(0, 100), foodCategory: category, decayPattern: decayPattern };
}

async function calculateFreshnessWithGemini(foodItem) {
	const today = new Date();
	const daysOwned = Math.floor((today - new Date(foodItem.addedDate)) / (1000 * 60 * 60 * 24));
	const daysUntilExpiry = Math.floor((new Date(foodItem.expiryDate) - today) / (1000 * 60 * 60 * 24));
	const isExpiringToday = daysUntilExpiry === 0;
	const foodCategory = determineFoodCategory(foodItem.name);
	const criticalCombination = (isExpiringToday && foodItem.condition === 'Near expiry') || (isExpiringToday && isDairyProduct(foodItem.name));

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
		percentage_of_shelf_life_elapsed: foodItem.shelfLife > 0 ? Math.min(100, Math.round((daysOwned / foodItem.shelfLife) * 100)) : 100
	};

	// Improved prompt with strict JSON instruction
	const prompt = `You are a professional food science expert specializing in food freshness assessment.

Analyze the following food item and return ONLY a valid JSON object with no additional text, explanations, or markdown formatting.

CRITICAL: Return ONLY valid JSON in this exact format:
{
  "freshness": <number 0-100>,
  "needs_alert": <boolean>,
  "explanation": "<string, max 100 characters>",
  "food_category": "<string>",
  "decay_pattern": "<'rapid' | 'standard' | 'slow'>"
}

Food Item Data:
${JSON.stringify(promptData, null, 2)}

Assessment Rules (MUST ENFORCE):
- Items marked "Near expiry" AND expiring today: freshness MUST BE 30 OR LOWER
- Dairy products expiring today: freshness MUST BE 40 OR LOWER
- Any item expired (negative days until expiry): freshness MUST BE 20 OR LOWER
- Items expiring today: freshness MAXIMUM 50
- Items marked "Near expiry": freshness MAXIMUM 60

Alert Rules (needs_alert = true if ANY apply):
- Item expiring today or already expired
- Freshness below 30%
- Dairy or meat item with freshness below 40%
- Item expiring within 3 days AND freshness below 60%

Return ONLY the JSON object. Do not include any text before or after the JSON.`;

	try {
		console.log(`\n🍎 Calculating freshness for: ${foodItem.name}`);
		const json = await callGeminiJSON(prompt, { 
			temperature: 0.2, 
			maxOutputTokens: 512,
			expectedKeys: ['freshness', 'needs_alert', 'explanation', 'food_category', 'decay_pattern']
		});

		let freshness = Math.max(0, Math.min(100, Math.round(Number(json.freshness))));
		let needsAlert = Boolean(json.needs_alert);
		const explanation = typeof json.explanation === 'string' ? json.explanation : '';

		// Apply critical rules as guardrails
		if (isExpiringToday && foodItem.condition === 'Near expiry' && freshness > 30) { freshness = 30; needsAlert = true; }
		else if (isExpiringToday && isDairyProduct(foodItem.name) && freshness > 40)   { freshness = 40; needsAlert = true; }
		else if (daysUntilExpiry < 0 && freshness > 20)                                 { freshness = 20; needsAlert = true; }
		else if (isExpiringToday && freshness > 50)                                     { freshness = 50; needsAlert = true; }
		else if (foodItem.condition === 'Near expiry' && freshness > 60)                { freshness = 60; }

		console.log(`✅ Gemini freshness calculation for ${foodItem.name}: ${freshness}%, alert: ${needsAlert}, reason: ${explanation}`);
		return {
			freshness,
			needsAlert,
			explanation,
			foodCategory: json.food_category || foodCategory,
			decayPattern: json.decay_pattern || 'standard'
		};
	} catch (e) {
		console.error(`❌ Error calculating freshness with Gemini for ${foodItem.name}:`, e.message);
		console.log('🔄 Falling back to basic freshness calculation');
		return calculateBasicFreshness(foodItem);
	}
}

async function generateRecipeSuggestionsWithGemini(ingredients) {
	try {
		// Improved prompt with strict JSON instruction
		const prompt = `You are a helpful cooking assistant specializing in creating recipes from available ingredients.

Using these ingredients: ${ingredients.join(', ')}

Generate exactly 5 diverse, creative recipes. Return ONLY valid, complete JSON with no additional text, explanations, or markdown formatting.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no text before or after
2. Ensure the JSON is complete and properly closed (all brackets and braces closed)
3. Do not truncate or cut off the response
4. Do not wrap in markdown code blocks

REQUIRED JSON FORMAT:
{
  "recipes": [
    {
      "title": "<string>",
      "ingredients": ["<string>", ...],
      "instructions": "<string - step by step instructions>",
      "prepTime": "<string - e.g., '10 mins'>",
      "cookTime": "<string - e.g., '20 mins'>",
      "matchedIngredients": ["<string>", ...]
    }
  ]
}

Recipe Requirements:
- Generate exactly 5 recipes
- Each recipe must use at least 2 ingredients from the provided list
- matchedIngredients should be a subset of the provided ingredients
- Instructions should be clear, step-by-step (but concise)
- Ensure variety (different cuisines, cooking methods, meal types)
- Make recipes practical and achievable

IMPORTANT: Return a complete, valid JSON object. Ensure all arrays and objects are properly closed.`;

		console.log(`\n🍳 Generating recipe suggestions for ingredients: ${ingredients.join(', ')}`);
		const json = await callGeminiJSON(prompt, { 
			temperature: 0.9, 
			maxOutputTokens: 4000, // Increased to handle 5 complete recipes
			expectedKeys: ['recipes']
		});
		
		if (!json?.recipes || !Array.isArray(json.recipes)) {
			console.error('❌ Invalid recipe structure from Gemini:', json);
			throw new Error('Gemini did not return recipes in expected format');
		}

		if (json.recipes.length === 0) {
			console.error('❌ Gemini returned empty recipes array');
			throw new Error('No recipes generated');
		}
		
		console.log(`✅ Successfully generated ${json.recipes.length} recipes from Gemini`);
		return json.recipes;
	} catch (error) {
		console.error('❌ Error generating recipe suggestions with Gemini:', error.message);
		throw error;
	}
}

module.exports = {
	calculateFreshnessWithGemini,
	generateRecipeSuggestionsWithGemini,
	calculateBasicFreshness,
	determineFoodCategory
};
