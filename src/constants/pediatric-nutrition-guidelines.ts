/**
 * Age-based nutritional guidelines following AAP/AHA recommendations
 *
 * Sources:
 * - American Academy of Pediatrics (AAP) - Nutrition Guidelines
 * - American Heart Association (AHA) - Dietary Guidelines for Children
 * - Dietary Guidelines for Americans 2020-2025
 *
 * Note: These guidelines are based on recommendations for healthy children
 * and may need to be adjusted for specific medical conditions.
 */

export type AgeGroup = '1-3' | '4-8' | '9-13' | '14-18';

export interface PediatricNutritionGuidelines {
  caloriesMin: number;
  caloriesMax: number;
  proteinGrams: number;      // RDA based on AAP/AHA recommendations
  fatPercentMin: number;     // % of total calories - AAP/AHA guidelines
  fatPercentMax: number;
  carbsPercentMin: number;   // % of total calories - AAP/AHA guidelines
  carbsPercentMax: number;
  sodiumMaxMg: number;       // Max sodium in mg per day - AHA recommendations
  sugarMaxG: number;         // Max added sugars in g per day - AAP/AHA recommendations
  saturatedFatMaxG: number;  // Max saturated fat in g per day - AAP/AHA recommendations
}

const GUIDELINES: Record<AgeGroup, PediatricNutritionGuidelines> = {
  '1-3': {
    caloriesMin: 1000,
    caloriesMax: 1400,
    proteinGrams: 13,
    fatPercentMin: 30,
    fatPercentMax: 40,
    carbsPercentMin: 45,
    carbsPercentMax: 65,
    sodiumMaxMg: 1200,
    sugarMaxG: 25,           // AAP/AHA recommendation for 1-3 year olds
    saturatedFatMaxG: 10,    // AAP/AHA recommendation for 1-3 year olds
  },
  '4-8': {
    caloriesMin: 1200,
    caloriesMax: 1600,
    proteinGrams: 35,
    fatPercentMin: 25,
    fatPercentMax: 35,
    carbsPercentMin: 45,
    carbsPercentMax: 55,
    sodiumMaxMg: 1500,
    sugarMaxG: 25,           // AAP/AHA recommendation for 4-8 year olds
    saturatedFatMaxG: 12,    // AAP/AHA recommendation for 4-8 year olds
  },
  '9-13': {
    caloriesMin: 1800,
    caloriesMax: 2600,
    proteinGrams: 34,
    fatPercentMin: 25,
    fatPercentMax: 35,
    carbsPercentMin: 45,
    carbsPercentMax: 65,
    sodiumMaxMg: 1800,
    sugarMaxG: 25,           // AAP/AHA recommendation for 9-13 year olds
    saturatedFatMaxG: 15,    // AAP/AHA recommendation for 9-13 year olds
  },
  '14-18': {
    caloriesMin: 2000,
    caloriesMax: 3200,
    proteinGrams: 52,  // average for teens
    fatPercentMin: 25,
    fatPercentMax: 35,
    carbsPercentMin: 45,
    carbsPercentMax: 65,
    sodiumMaxMg: 2300,
    sugarMaxG: 36,           // AAP/AHA recommendation for 14-18 year olds
    saturatedFatMaxG: 20,    // AAP/AHA recommendation for 14-18 year olds
  },
};

export function getAgeGroup(age: number): AgeGroup {
  if (age < 1) {
    throw new Error(`Age must be at least 1 year, got: ${age}`);
  }
  if (age > 18) {
    throw new Error(`Age must be no more than 18 years, got: ${age}`);
  }

  if (age >= 1 && age <= 3) return '1-3';
  if (age >= 4 && age <= 8) return '4-8';
  if (age >= 9 && age <= 13) return '9-13';
  return '14-18';
}

export function getPediatricGuidelines(age: number): PediatricNutritionGuidelines {
  const ageGroup = getAgeGroup(age);
  return GUIDELINES[ageGroup];
}