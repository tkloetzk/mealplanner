import {
  createEmptyMealSelection,
  nutritionToMealSelection,
  CALORIES_PER_PROTEIN,
  CALORIES_PER_CARB,
  CALORIES_PER_FAT,
  getProgressBarWidth,
  getProgressColor,
  getNutrientColor,
  ensureNumber,
  calculateExpectedCalories
} from '../nutritionUtils';
import { NutritionSummary } from '@/types/food';

describe('nutritionUtils', () => {
  describe('createEmptyMealSelection', () => {
    it('creates an empty meal selection with all null values', () => {
      const emptySelection = createEmptyMealSelection();
      
      expect(emptySelection.proteins).toBeNull();
      expect(emptySelection.fruits).toBeNull();
      expect(emptySelection.vegetables).toBeNull();
      expect(emptySelection.grains).toBeNull();
      expect(emptySelection.milk).toBeNull();
      expect(emptySelection.ranch).toBeNull();
      expect(emptySelection.condiments).toEqual([]);
    });
  });

  describe('nutritionToMealSelection', () => {
    it('converts nutrition summary to meal selection', () => {
      const nutrition: NutritionSummary = {
        calories: 300,
        protein: 25,
        carbs: 30,
        fat: 10
      };

      const mealSelection = nutritionToMealSelection(nutrition);
      
      expect(mealSelection.proteins).toBeDefined();
      expect(mealSelection.proteins?.calories).toBe(300);
      expect(mealSelection.proteins?.protein).toBe(25);
      expect(mealSelection.proteins?.carbs).toBe(30);
      expect(mealSelection.proteins?.fat).toBe(10);
      expect(mealSelection.proteins?.name).toBe('Total');
    });

    it('returns empty selection for zero nutrition', () => {
      const nutrition: NutritionSummary = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      const mealSelection = nutritionToMealSelection(nutrition);
      expect(mealSelection.proteins).toBeNull();
    });
  });

  describe('nutrition constants', () => {
    it('has correct calorie conversion constants', () => {
      expect(CALORIES_PER_PROTEIN).toBe(4);
      expect(CALORIES_PER_CARB).toBe(4);
      expect(CALORIES_PER_FAT).toBe(9);
    });
  });

  describe('getProgressBarWidth', () => {
    it('calculates percentage width correctly', () => {
      expect(getProgressBarWidth(50, 100)).toBe('50%');
      expect(getProgressBarWidth(75, 100)).toBe('75%');
      expect(getProgressBarWidth(25, 50)).toBe('50%');
    });

    it('caps at 100% for over-target values', () => {
      expect(getProgressBarWidth(150, 100)).toBe('100%');
      expect(getProgressBarWidth(200, 100)).toBe('100%');
    });

    it('handles zero target gracefully', () => {
      expect(getProgressBarWidth(10, 0)).toBe('100%');
    });
  });

  describe('getProgressColor', () => {
    it('returns correct colors based on percentage', () => {
      expect(getProgressColor(50, 100)).toBe('bg-green-500'); // 50%
      expect(getProgressColor(92, 100)).toBe('bg-yellow-500'); // 92%
      expect(getProgressColor(120, 100)).toBe('bg-red-500'); // 120%
    });

    it('handles edge cases', () => {
      expect(getProgressColor(90, 100)).toBe('bg-green-500'); // Exactly 90%
      expect(getProgressColor(95, 100)).toBe('bg-yellow-500'); // Exactly 95%
      expect(getProgressColor(110, 100)).toBe('bg-red-500'); // Exactly 110% - over target
      expect(getProgressColor(111, 100)).toBe('bg-red-500'); // Above 110%
    });
  });

  describe('getNutrientColor', () => {
    it('returns correct colors based on range', () => {
      expect(getNutrientColor(5, 10, 20)).toBe('text-yellow-600'); // Below min
      expect(getNutrientColor(15, 10, 20)).toBe('text-green-600'); // In range
      expect(getNutrientColor(25, 10, 20)).toBe('text-red-600'); // Above max
    });

    it('handles edge cases', () => {
      expect(getNutrientColor(10, 10, 20)).toBe('text-green-600'); // Exactly min
      expect(getNutrientColor(20, 10, 20)).toBe('text-green-600'); // Exactly max
    });
  });

  describe('ensureNumber', () => {
    it('converts valid numbers correctly', () => {
      expect(ensureNumber(5)).toBe(5);
      expect(ensureNumber('10')).toBe(10);
      expect(ensureNumber('3.14')).toBe(3.14);
      expect(ensureNumber(0)).toBe(0);
    });

    it('returns 0 for invalid values', () => {
      expect(ensureNumber('invalid')).toBe(0);
      expect(ensureNumber(null)).toBe(0);
      expect(ensureNumber(undefined)).toBe(0);
      expect(ensureNumber({})).toBe(0);
      expect(ensureNumber([])).toBe(0);
      expect(ensureNumber(NaN)).toBe(0);
    });

    it('handles edge cases', () => {
      expect(ensureNumber('')).toBe(0);
      expect(ensureNumber('0')).toBe(0);
      expect(ensureNumber(Infinity)).toBe(Infinity);
      expect(ensureNumber(-Infinity)).toBe(-Infinity);
    });
  });

  describe('calculateExpectedCalories', () => {
    it('calculates calories from macronutrients correctly', () => {
      const protein = 25; // 25 * 4 = 100 calories
      const carbs = 30;   // 30 * 4 = 120 calories  
      const fat = 10;     // 10 * 9 = 90 calories
      
      const expectedCalories = calculateExpectedCalories(protein, carbs, fat);
      expect(expectedCalories).toBe(310); // 100 + 120 + 90
    });

    it('handles zero values', () => {
      expect(calculateExpectedCalories(0, 0, 0)).toBe(0);
      expect(calculateExpectedCalories(10, 0, 0)).toBe(40);
      expect(calculateExpectedCalories(0, 10, 0)).toBe(40);
      expect(calculateExpectedCalories(0, 0, 10)).toBe(90);
    });

    it('handles decimal values', () => {
      const result = calculateExpectedCalories(12.5, 15.3, 8.2);
      const expected = (12.5 * 4) + (15.3 * 4) + (8.2 * 9);
      expect(result).toBeCloseTo(expected, 2);
    });

    it('uses correct calorie conversion ratios', () => {
      const proteinCals = calculateExpectedCalories(1, 0, 0);
      const carbCals = calculateExpectedCalories(0, 1, 0);
      const fatCals = calculateExpectedCalories(0, 0, 1);
      
      expect(proteinCals).toBe(CALORIES_PER_PROTEIN);
      expect(carbCals).toBe(CALORIES_PER_CARB);
      expect(fatCals).toBe(CALORIES_PER_FAT);
    });
  });
});