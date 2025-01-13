// utils/nutriscoreCalculator.ts

interface NutriscoreData {
  energy: number;
  fiber: number;
  fruits_vegetables_nuts_colza_walnut_olive_oils?: number;
  is_beverage: number;
  is_cheese: number;
  is_fat?: number;
  is_water: number;
  proteins: number;
  saturated_fat: number;
  sodium: number;
  sugars: number;
  energy_from_saturated_fat?: number;
  fat?: number;
  fruits_vegetables_legumes?: number;
  is_fat_oil_nuts_seeds?: number;
  is_red_meat_product?: number;
  salt?: number;
  saturatedFat: number;
  saturated_fat_ratio?: number;
  protein: number;
}

interface NutriscoreYear {
  category_available: number;
  data: NutriscoreData;
  grade: string;
  nutrients_available: number;
  nutriscore_applicable: number;
  nutriscore_computed: number;
}

interface Nutriscore {
  [year: string]: NutriscoreYear;
}

type NutriScore = "A" | "B" | "C" | "D" | "E";

function getLastNutriscoreData(nutriscore: Nutriscore): NutriscoreData {
  // Get all the years as keys and sort them in descending order
  const years = Object.keys(nutriscore).sort((a, b) => Number(b) - Number(a));
  // Return the data object of the most recent year
  return nutriscore[years[0]].data;
}

export function calculateNutriScore(nutriscore: Nutriscore): NutriScore {
  const values = getLastNutriscoreData(nutriscore);
  // Calculate negative points
  const energyPoints = calculateEnergyPoints(values.energy);
  const sugarsPoints = calculateSugarsPoints(values.sugars);
  const saturatedFatPoints = calculateSaturatedFatPoints(values.saturatedFat);
  const sodiumPoints = calculateSodiumPoints(values.sodium);

  const negativePoints =
    energyPoints + sugarsPoints + saturatedFatPoints + sodiumPoints;

  // Calculate positive points
  const fiberPoints = calculateFiberPoints(values.fiber || 0);
  const proteinPoints = calculateProteinPoints(values.protein);
  const fruitsVegNutsPoints = calculateFruitsVegNutsPoints(
    values.fruits_vegetables_legumes || 0
  );

  const positivePoints = fiberPoints + proteinPoints + fruitsVegNutsPoints;

  // Calculate final score
  const finalScore = negativePoints - positivePoints;

  // Convert score to letter grade

  console.log("finalScore", finalScore, convertScoreToGrade(finalScore));
  return convertScoreToGrade(finalScore);
}

function calculateEnergyPoints(energy: number): number {
  if (energy <= 335) return 0;
  if (energy <= 670) return 1;
  if (energy <= 1005) return 2;
  if (energy <= 1340) return 3;
  if (energy <= 1675) return 4;
  if (energy <= 2010) return 5;
  if (energy <= 2345) return 6;
  if (energy <= 2680) return 7;
  if (energy <= 3015) return 8;
  if (energy <= 3350) return 9;
  return 10;
}

function calculateSugarsPoints(sugars: number): number {
  if (sugars <= 4.5) return 0;
  if (sugars <= 9) return 1;
  if (sugars <= 13.5) return 2;
  if (sugars <= 18) return 3;
  if (sugars <= 22.5) return 4;
  if (sugars <= 27) return 5;
  if (sugars <= 31) return 6;
  if (sugars <= 36) return 7;
  if (sugars <= 40) return 8;
  if (sugars <= 45) return 9;
  return 10;
}

function calculateSaturatedFatPoints(saturatedFat: number): number {
  if (saturatedFat <= 1) return 0;
  if (saturatedFat <= 2) return 1;
  if (saturatedFat <= 3) return 2;
  if (saturatedFat <= 4) return 3;
  if (saturatedFat <= 5) return 4;
  if (saturatedFat <= 6) return 5;
  if (saturatedFat <= 7) return 6;
  if (saturatedFat <= 8) return 7;
  if (saturatedFat <= 9) return 8;
  if (saturatedFat <= 10) return 9;
  return 10;
}

function calculateSodiumPoints(sodium: number): number {
  const sodiumPercentage = sodium / 1000; // Convert to g
  if (sodiumPercentage <= 0.09) return 0;
  if (sodiumPercentage <= 0.18) return 1;
  if (sodiumPercentage <= 0.27) return 2;
  if (sodiumPercentage <= 0.36) return 3;
  if (sodiumPercentage <= 0.45) return 4;
  if (sodiumPercentage <= 0.54) return 5;
  if (sodiumPercentage <= 0.63) return 6;
  if (sodiumPercentage <= 0.72) return 7;
  if (sodiumPercentage <= 0.81) return 8;
  if (sodiumPercentage <= 0.9) return 9;
  return 10;
}

function calculateFiberPoints(fiber: number): number {
  if (fiber <= 0.9) return 0;
  if (fiber <= 1.9) return 1;
  if (fiber <= 2.8) return 2;
  if (fiber <= 3.7) return 3;
  if (fiber <= 4.7) return 4;
  return 5;
}

function calculateProteinPoints(protein: number): number {
  if (protein <= 1.6) return 0;
  if (protein <= 3.2) return 1;
  if (protein <= 4.8) return 2;
  if (protein <= 6.4) return 3;
  if (protein <= 8.0) return 4;
  return 5;
}

function calculateFruitsVegNutsPoints(percentage: number): number {
  if (percentage <= 40) return 0;
  if (percentage <= 60) return 1;
  if (percentage <= 80) return 2;
  return 5;
}

function convertScoreToGrade(score: number): NutriScore {
  if (score <= -1) return "A";
  if (score <= 2) return "B";
  if (score <= 10) return "C";
  if (score <= 18) return "D";
  return "E";
}
