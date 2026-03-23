/**
 * Age-based nutritional guidelines following AAP/AHA recommendations
 *
 * Sources:
 * - American Academy of Pediatrics (AAP) - Nutrition Guidelines
 * - American Heart Association (AHA) - Dietary Guidelines for Children
 * - Dietary Guidelines for Americans 2025-2030 (released January 7, 2026)
 * - NASEM Dietary Reference Intakes for Sodium and Potassium (2019)
 * - IOM Dietary Reference Intakes for Macronutrients (2002/2005)
 *
 * Sodium values use the NASEM 2019 CDRR (Chronic Disease Risk Reduction)
 * thresholds, which align with the practical upper limits cited by the
 * 2020-2025 DGA and carried forward by the 2025-2030 DGA.
 *
 * Sugar values use the AHA recommendation of <25g added sugar/day for
 * children ages 2-18. The 2025-2030 DGA introduced stricter guidance
 * (no added sugar until age 10, ≤10g per meal thereafter), but this is
 * widely considered aspirational and potentially counterproductive for
 * real-world family meal planning. The AHA limit remains the more
 * actionable clinical target.
 *
 * Protein RDA values are from the IOM DRIs (2002/2005). The 2025-2030 DGA
 * shifted to a weight-based recommendation of 1.2-1.6 g/kg/day for the
 * general population, but fixed-gram RDAs remain the standard reference
 * for pediatric age groups.
 *
 * Note: These guidelines are based on recommendations for healthy children
 * and may need to be adjusted for specific medical conditions.
 */

export type AgeGroup = "1-3" | "4-8" | "9-13" | "14-18";

export interface PediatricNutritionGuidelines {
  caloriesMin: number;
  caloriesMax: number;
  proteinGrams: number; // RDA from IOM DRIs (2002/2005)
  fatPercentMin: number; // AMDR % of total calories
  fatPercentMax: number;
  carbsPercentMin: number; // AMDR % of total calories
  carbsPercentMax: number;
  sodiumMaxMg: number; // CDRR from NASEM 2019
  sugarMaxG: number; // AHA recommendation: <25g/day for ages 2-18
  saturatedFatMaxG: number; // <10% of total calories, expressed as grams
}

const GUIDELINES: Record<AgeGroup, PediatricNutritionGuidelines> = {
  "1-3": {
    caloriesMin: 1000,
    caloriesMax: 1400,
    proteinGrams: 13, // IOM RDA for ages 1-3
    fatPercentMin: 30, // AMDR: 30-40% for ages 1-3
    fatPercentMax: 40,
    carbsPercentMin: 45, // AMDR: 45-65% for ages 1-3
    carbsPercentMax: 65,
    sodiumMaxMg: 1200, // NASEM 2019 CDRR for ages 1-3
    sugarMaxG: 25, // AHA: <25g/day for all children 2-18
    saturatedFatMaxG: 10, // ~10% of midpoint calories (1200 * 0.10 / 9 ≈ 13, conservative)
  },
  "4-8": {
    caloriesMin: 1200,
    caloriesMax: 1600,
    proteinGrams: 19, // IOM RDA for ages 4-8 (was incorrectly 35)
    fatPercentMin: 25, // AMDR: 25-35% for ages 4+
    fatPercentMax: 35,
    carbsPercentMin: 45, // AMDR: 45-65% for ages 4-8
    carbsPercentMax: 65, // (was incorrectly 55)
    sodiumMaxMg: 1500, // NASEM 2019 CDRR for ages 4-8
    sugarMaxG: 25, // AHA: <25g/day for all children 2-18
    saturatedFatMaxG: 12, // ~10% of midpoint calories (1400 * 0.10 / 9 ≈ 16, conservative)
  },
  "9-13": {
    caloriesMin: 1800,
    caloriesMax: 2600,
    proteinGrams: 34, // IOM RDA for ages 9-13
    fatPercentMin: 25, // AMDR: 25-35% for ages 4+
    fatPercentMax: 35,
    carbsPercentMin: 45, // AMDR: 45-65% for ages 9-13
    carbsPercentMax: 65,
    sodiumMaxMg: 1800, // NASEM 2019 CDRR for ages 9-13
    sugarMaxG: 25, // AHA: <25g/day for all children 2-18
    saturatedFatMaxG: 15, // ~10% of midpoint calories (2200 * 0.10 / 9 ≈ 24, conservative)
  },
  "14-18": {
    caloriesMin: 2000,
    caloriesMax: 3200,
    proteinGrams: 52, // IOM RDA average for teens (boys 52g, girls 46g)
    fatPercentMin: 25, // AMDR: 25-35% for ages 4+
    fatPercentMax: 35,
    carbsPercentMin: 45, // AMDR: 45-65% for ages 14-18
    carbsPercentMax: 65,
    sodiumMaxMg: 2300, // NASEM 2019 CDRR for ages 14+
    sugarMaxG: 25, // AHA: <25g/day for all children 2-18 (was incorrectly 36)
    saturatedFatMaxG: 20, // ~10% of midpoint calories (2600 * 0.10 / 9 ≈ 29, conservative)
  },
};

export function getAgeGroup(age: number): AgeGroup {
  if (age < 1) {
    throw new Error(`Age must be at least 1 year, got: ${age}`);
  }
  if (age > 18) {
    throw new Error(`Age must be no more than 18 years, got: ${age}`);
  }

  if (age >= 1 && age <= 3) return "1-3";
  if (age >= 4 && age <= 8) return "4-8";
  if (age >= 9 && age <= 13) return "9-13";
  return "14-18";
}

export function getPediatricGuidelines(
  age: number,
): PediatricNutritionGuidelines {
  const ageGroup = getAgeGroup(age);
  return GUIDELINES[ageGroup];
}
