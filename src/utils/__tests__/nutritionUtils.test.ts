import {
  createEmptyMealSelection,
  nutritionToMealSelection,
  CALORIES_PER_PROTEIN,
  CALORIES_PER_CARB,
  CALORIES_PER_FAT,
  getProgressBarWidth,
  getProgressColor,
  getNutrientColor,
  getSodiumColor,
  getSugarColor,
  getSaturatedFatColor,
  ensureNumber,
  calculateExpectedCalories,
  distributeMealCalories,
  adjustForActivity
} from '../nutritionUtils';
import { NutritionSummary } from '@/types/food';

describe('nutritionUtils', () => {
  describe('createEmptyMealSelection', () => {
    it('creates an empty meal selection with empty arrays and null single foods', () => {
      const emptySelection = createEmptyMealSelection();

      expect(emptySelection.proteins).toEqual([]);
      expect(emptySelection.fruits).toEqual([]);
      expect(emptySelection.vegetables).toEqual([]);
      expect(emptySelection.grains).toEqual([]);
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

      expect(mealSelection.proteins).toHaveLength(1);
      expect(mealSelection.proteins[0]?.calories).toBe(300);
      expect(mealSelection.proteins[0]?.protein).toBe(25);
      expect(mealSelection.proteins[0]?.carbs).toBe(30);
      expect(mealSelection.proteins[0]?.fat).toBe(10);
      expect(mealSelection.proteins[0]?.name).toBe('Total');
    });

    it('returns empty array for zero nutrition', () => {
      const nutrition: NutritionSummary = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      const mealSelection = nutritionToMealSelection(nutrition);
      expect(mealSelection.proteins).toEqual([]);
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

  describe('adjustForActivity', () => {
    it('adjusts calories based on activity level', () => {
      const baseCalories = 2000;

      // Sedentary (0.9 multiplier)
      expect(adjustForActivity(baseCalories, 'sedentary')).toBe(1800);

      // Moderate (1.0 multiplier) - no change
      expect(adjustForActivity(baseCalories, 'moderate')).toBe(2000);

      // Active (1.15 multiplier)
      expect(adjustForActivity(baseCalories, 'active')).toBe(2300);
    });

    it('handles different calorie values', () => {
      expect(adjustForActivity(1000, 'sedentary')).toBe(900);
      expect(adjustForActivity(1000, 'moderate')).toBe(1000);
      expect(adjustForActivity(1000, 'active')).toBe(1150);

      expect(adjustForActivity(3000, 'sedentary')).toBe(2700);
      expect(adjustForActivity(3000, 'moderate')).toBe(3000);
      expect(adjustForActivity(3000, 'active')).toBe(3450);
    });

    it('rounds to nearest integer', () => {
      expect(adjustForActivity(1500, 'active')).toBe(1725); // 1500 * 1.15 = 1725
      expect(adjustForActivity(100, 'active')).toBe(115);   // 100 * 1.15 = 115
    });
  });

  describe('getSodiumColor', () => {
    it('returns correct colors based on sodium levels', () => {
      // At or below 80% of max - green (0 to 800 for max 1000)
      expect(getSodiumColor(799, 0, 1000)).toBe('text-green-600'); // 79.9% of max
      expect(getSodiumColor(790, 0, 1000)).toBe('text-green-600'); // 79% of max
      expect(getSodiumColor(800, 0, 1000)).toBe('text-green-600'); // Exactly 80% (800 out of 1000)

      // Above 80% but at or below max - yellow (801 to 1000 for max 1000)
      expect(getSodiumColor(801, 0, 1000)).toBe('text-yellow-600'); // Just above 80%
      expect(getSodiumColor(850, 0, 1000)).toBe('text-yellow-600'); // 85% of max
      expect(getSodiumColor(900, 0, 1000)).toBe('text-yellow-600'); // 90% of max
      expect(getSodiumColor(999, 0, 1000)).toBe('text-yellow-600'); // 99.9% of max
      expect(getSodiumColor(1000, 0, 1000)).toBe('text-yellow-600'); // Exactly at max

      // Above max - red (1001+ for max 1000)
      expect(getSodiumColor(1001, 0, 1000)).toBe('text-red-600'); // Above max
      expect(getSodiumColor(1200, 0, 1000)).toBe('text-red-600'); // Well above max
    });

    it('handles edge cases', () => {
      expect(getSodiumColor(0, 0, 1000)).toBe('text-green-600'); // Zero sodium
      expect(getSodiumColor(800, 0, 1000)).toBe('text-green-600'); // Exactly at 80% threshold
      expect(getSodiumColor(801, 0, 1000)).toBe('text-yellow-600'); // Just above 80% threshold
    });
  });

  describe('getSugarColor', () => {
    it('returns correct colors based on sugar levels', () => {
      // At or below 80% of max - green (0 to 20 for max 25)
      expect(getSugarColor(19, 0, 25)).toBe('text-green-600'); // 19 out of 25 (76%)
      expect(getSugarColor(20, 0, 25)).toBe('text-green-600'); // 20 out of 25 (80%)

      // Above 80% but at or below max - yellow (21 to 25 for max 25)
      expect(getSugarColor(21, 0, 25)).toBe('text-yellow-600'); // Just above 80%
      expect(getSugarColor(24, 0, 25)).toBe('text-yellow-600'); // 96% of max
      expect(getSugarColor(25, 0, 25)).toBe('text-yellow-600'); // Exactly at max

      // Above max - red (26+ for max 25)
      expect(getSugarColor(26, 0, 25)).toBe('text-red-600'); // Above max
      expect(getSugarColor(50, 0, 25)).toBe('text-red-600'); // Well above max
    });

    it('handles edge cases', () => {
      expect(getSugarColor(0, 0, 25)).toBe('text-green-600'); // Zero sugar
      expect(getSugarColor(20, 0, 25)).toBe('text-green-600'); // Exactly at 80% threshold
      expect(getSugarColor(21, 0, 25)).toBe('text-yellow-600'); // Just above 80% threshold
    });
  });

  describe('getSaturatedFatColor', () => {
    it('returns correct colors based on saturated fat levels', () => {
      // At or below 80% of max - green (0 to 16 for max 20)
      expect(getSaturatedFatColor(15, 0, 20)).toBe('text-green-600'); // 15 out of 20 (75%)
      expect(getSaturatedFatColor(16, 0, 20)).toBe('text-green-600'); // 16 out of 20 (80%)

      // Above 80% but at or below max - yellow (17 to 20 for max 20)
      expect(getSaturatedFatColor(17, 0, 20)).toBe('text-yellow-600'); // Just above 80%
      expect(getSaturatedFatColor(19, 0, 20)).toBe('text-yellow-600'); // 95% of max
      expect(getSaturatedFatColor(20, 0, 20)).toBe('text-yellow-600'); // Exactly at max

      // Above max - red (21+ for max 20)
      expect(getSaturatedFatColor(21, 0, 20)).toBe('text-red-600'); // Above max
      expect(getSaturatedFatColor(40, 0, 20)).toBe('text-red-600'); // Well above max
    });

    it('handles edge cases', () => {
      expect(getSaturatedFatColor(0, 0, 20)).toBe('text-green-600'); // Zero saturated fat
      expect(getSaturatedFatColor(16, 0, 20)).toBe('text-green-600'); // Exactly at 80% threshold
      expect(getSaturatedFatColor(17, 0, 20)).toBe('text-yellow-600'); // Just above 80% threshold
    });
  });

  describe('distributeMealCalories', () => {
    it('distributes calories based on default meal distribution', () => {
      const totalCalories = 2000;
      const enabledMeals = ['breakfast', 'lunch', 'dinner'];
      const result = distributeMealCalories(totalCalories, enabledMeals);

      // Total percentage for enabled meals: 25% + 29% + 31% = 85%
      // breakfast: (25/85) * 2000 = 588.24 -> 588
      // lunch: (29/85) * 2000 = 682.35 -> 682
      // dinner: (31/85) * 2000 = 729.41 -> 729
      expect(result.breakfast).toBe(588);
      expect(result.lunch).toBe(682);
      expect(result.dinner).toBe(729);
    });

    it('distributes equally when no default distribution exists', () => {
      const totalCalories = 1500;
      const enabledMeals = ['midmorning_snack', 'afternoon_snack', 'bedtime_snack'];
      const result = distributeMealCalories(totalCalories, enabledMeals);

      // Snack percentages: midmorning=8%, afternoon=15%, bedtime=8%, totaling 31%
      // midmorning: (8/31) * 1500 = 387.1 -> 387
      // afternoon: (15/31) * 1500 = 725.8 -> 726
      // bedtime: (8/31) * 1500 = 387.1 -> 387
      expect(result.midmorning_snack).toBe(387);
      expect(result.afternoon_snack).toBe(726);
      expect(result.bedtime_snack).toBe(387);
    });

    it('handles single meal', () => {
      const totalCalories = 1800;
      const enabledMeals = ['lunch'];
      const result = distributeMealCalories(totalCalories, enabledMeals);

      expect(result.lunch).toBe(1800);
    });

    it('returns empty object when no meals enabled', () => {
      const totalCalories = 2000;
      const enabledMeals: string[] = [];
      const result = distributeMealCalories(totalCalories, enabledMeals);

      expect(result).toEqual({});
    });
  });
});