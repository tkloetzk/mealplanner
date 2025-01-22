// Scoring ranges for nutritional components
const ENERGY_RANGES = [
  3350, 3015, 2680, 2345, 2010, 1675, 1340, 1005, 670, 335,
];
const SUGAR_RANGES = [45, 40, 36, 31, 27, 22.5, 18, 13.5, 9, 4.5];
const SAT_FAT_RANGES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const SODIUM_RANGES = [900, 810, 720, 630, 540, 450, 360, 270, 180, 90];
const FIBER_RANGES = [4.7, 3.7, 2.8, 1.9, 0.9];
const PROTEIN_RANGES = [8.0, 6.4, 4.8, 3.2, 1.6];
const FRUIT_VEG_RANGES = [80, 60, 40];

interface NutritionalData {
  energy: number; // kCal per 100g
  saturatedFat: number; // g per 100g
  sugars: number; // g per 100g
  sodium: number; // mg per 100g
  fiber: number; // g per 100g
  protein: number; // g per 100g
  fruitVegPercent: number; // % of fruits/vegetables/nuts/legumes
}

interface AdditiveData {
  additives: string[]; // List of additive codes (e.g., "E100")
}

export type YukaRating = "Excellent" | "Good" | "Mediocre" | "Poor";

export function getYukaRating(score: number): YukaRating {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 25) return "Mediocre";
  return "Poor";
}

export function getYukaRatingColor(rating: YukaRating): string {
  switch (rating) {
    case "Excellent":
      return "text-green-600";
    case "Good":
      return "text-blue-600";
    case "Mediocre":
      return "text-yellow-600";
    case "Poor":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

// Maps additives to their risk levels
const ADDITIVE_RISK_LEVELS: Record<string, "low" | "moderate" | "high"> = {
  // Colors
  E100: "low", // Curcumin
  E101: "low", // Riboflavin
  E102: "high", // Tartrazine
  E104: "high", // Quinoline Yellow
  E120: "low", // Carmine
  E122: "high", // Azorubine
  E124: "high", // Ponceau 4R

  // Preservatives
  E200: "low", // Sorbic acid
  E202: "low", // Potassium sorbate
  E211: "high", // Sodium benzoate
  E220: "moderate", // Sulphur dioxide
  E250: "high", // Sodium nitrite
  E251: "high", // Sodium nitrate

  // Antioxidants
  E300: "low", // Ascorbic acid (Vitamin C)
  E306: "low", // Tocopherol (Vitamin E)
  E320: "high", // BHA
  E321: "high", // BHT

  // Emulsifiers
  E322: "low", // Lecithins
  E330: "low", // Citric acid
  E407: "moderate", // Carrageenan
  E420: "low", // Sorbitol
  E471: "low", // Mono- and diglycerides of fatty acids

  // Flavor enhancers
  E620: "moderate", // Glutamic acid
  E621: "high", // Monosodium glutamate (MSG)
  E631: "moderate", // Sodium inosinate
  E635: "moderate", // Sodium 5-ribonucleotides
};

function calculateNutritionalPoints(data: NutritionalData): number {
  // Calculate negative points
  let negativePoints = 0;

  // Energy points (0-10)
  for (let i = 0; i < ENERGY_RANGES.length; i++) {
    if (data.energy > ENERGY_RANGES[i]) {
      negativePoints += 10 - i;
      break;
    }
  }

  // Saturated fat points (0-10)
  for (let i = 0; i < SAT_FAT_RANGES.length; i++) {
    if (data.saturatedFat > SAT_FAT_RANGES[i]) {
      negativePoints += 10 - i;
      break;
    }
  }

  // Sugar points (0-10)
  for (let i = 0; i < SUGAR_RANGES.length; i++) {
    if (data.sugars > SUGAR_RANGES[i]) {
      negativePoints += 10 - i;
      break;
    }
  }

  // Sodium points (0-10)
  for (let i = 0; i < SODIUM_RANGES.length; i++) {
    if (data.sodium > SODIUM_RANGES[i]) {
      negativePoints += 10 - i;
      break;
    }
  }

  // Calculate positive points
  let positivePoints = 0;

  // Fiber points (0-5)
  for (let i = 0; i < FIBER_RANGES.length; i++) {
    if (data.fiber > FIBER_RANGES[i]) {
      positivePoints += 5 - i;
      break;
    }
  }

  // Protein points (0-5)
  for (let i = 0; i < PROTEIN_RANGES.length; i++) {
    if (data.protein > PROTEIN_RANGES[i]) {
      positivePoints += 5 - i;
      break;
    }
  }

  // Fruits/vegetables points (0-5)
  for (let i = 0; i < FRUIT_VEG_RANGES.length; i++) {
    if (data.fruitVegPercent > FRUIT_VEG_RANGES[i]) {
      positivePoints += 5 - i;
      break;
    }
  }

  // Final nutritional score
  return Math.min(Math.max(positivePoints - negativePoints, -15), 40);
}

function calculateAdditiveScore(data: AdditiveData): number {
  let score = 30; // Start with full points

  for (const additive of data.additives) {
    const riskLevel = ADDITIVE_RISK_LEVELS[additive];
    switch (riskLevel) {
      case "high":
        score -= 6;
        break;
      case "moderate":
        score -= 3;
        break;
      case "low":
        score -= 1;
        break;
    }
  }

  return Math.max(score, 0); // Don't go below 0
}

interface YukaScoreInput {
  nutritionalData: NutritionalData;
  additiveData: AdditiveData;
  isOrganic: boolean;
}

export function calculateYukaScoreFromFood(food: {
  calories: number;
  fat: number;
  saturatedFat?: number;
  sugars?: number;
  sodium?: number;
  fiber?: number;
  protein: number;
  additives?: string[];
  isOrganic?: boolean;
}): number {
  // Convert food data to YukaScoreInput format
  const input: YukaScoreInput = {
    nutritionalData: {
      energy: food.calories,
      saturatedFat: food.saturatedFat || food.fat * 0.4, // Estimate if not provided
      sugars: food.sugars || 0,
      sodium: food.sodium || 0,
      fiber: food.fiber || 0,
      protein: food.protein,
      fruitVegPercent:
        food.category === "fruits" || food.category === "vegetables" ? 100 : 0,
    },
    additiveData: {
      additives: food.additives || [],
    },
    isOrganic: food.isOrganic || false,
  };

  return calculateYukaScore(input);
}

export function calculateYukaScore(input: YukaScoreInput): number {
  // Normalize nutritional score to 0-60 range
  const normalizedNutritionalScore =
    ((calculateNutritionalPoints(input.nutritionalData) + 15) / 55) * 60;

  // Calculate additive score (0-30)
  const additiveScore = calculateAdditiveScore(input.additiveData);

  // Add organic bonus (0 or 10)
  const organicScore = input.isOrganic ? 10 : 0;

  // Calculate final score
  const finalScore = normalizedNutritionalScore + additiveScore + organicScore;

  // Return score rounded to nearest integer, capped at 100
  return Math.min(Math.round(finalScore), 100);
}

// Parse E-numbers from ingredients text
export function extractAdditives(ingredients: string): string[] {
  const eNumberRegex = /E\d{3,4}[a-z]?/g;
  return ingredients?.match(eNumberRegex) || [];
}
