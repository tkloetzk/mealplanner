import {
  normalizeFoodData,
  calculateNutritionForServing,
} from "../foodMigration";
import { Food } from "@/types/food";
import { NutritionInfo } from "@/types/shared";

describe("foodMigration", () => {
  describe("normalizeFoodData", () => {
    it("should convert legacy single serving format to new format", () => {
      const legacyFood: Partial<Food> = {
        id: "1",
        name: "Apple",
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        servingSize: "1",
        servingSizeUnit: "piece",
        category: "fruits",
        meal: ["breakfast"],
        servings: 1,
      };

      const normalized = normalizeFoodData(legacyFood as Food);

      // Should have servingSizes array
      expect(normalized.servingSizes).toBeDefined();
      expect(normalized.servingSizes).toHaveLength(1);

      // Should have baseNutritionPer100g
      expect(normalized.baseNutritionPer100g).toBeDefined();

      // First serving size should match original
      const servingSize = normalized.servingSizes![0];
      expect(servingSize.label).toBe("1 piece");
      expect(servingSize.amount).toBe(1);
      expect(servingSize.unit).toBe("piece");
      expect(servingSize.gramsEquivalent).toBeGreaterThan(0);
    });

    it("should preserve new format foods unchanged", () => {
      const newFood: Partial<Food> = {
        id: "2",
        name: "Strawberry",
        calories: 32,
        protein: 0.7,
        carbs: 7.7,
        fat: 0.3,
        servingSizes: [
          {
            id: "100g",
            label: "100g",
            amount: 100,
            unit: "g",
            gramsEquivalent: 100,
          },
        ],
        baseNutritionPer100g: {
          calories: 32,
          protein: 0.7,
          carbs: 7.7,
          fat: 0.3,
        },
        category: "fruits",
        meal: ["breakfast"],
        servings: 1,
      };

      const normalized = normalizeFoodData(newFood as Food);

      // Should be unchanged
      expect(normalized.servingSizes).toEqual(newFood.servingSizes);
      expect(normalized.baseNutritionPer100g).toEqual(
        newFood.baseNutritionPer100g
      );
    });

    it("should calculate baseNutritionPer100g correctly for gram-based foods", () => {
      const legacyFood: Partial<Food> = {
        id: "3",
        name: "Rice",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        servingSize: "50",
        servingSizeUnit: "g",
        category: "grains",
        meal: ["lunch"],
        servings: 1,
      };

      const normalized = normalizeFoodData(legacyFood as Food);

      // Base nutrition should be doubled (50g serving -> 100g base)
      expect(normalized.baseNutritionPer100g?.calories).toBeCloseTo(260, 0);
      expect(normalized.baseNutritionPer100g?.protein).toBeCloseTo(5.4, 1);
      expect(normalized.baseNutritionPer100g?.carbs).toBeCloseTo(56, 0);
      expect(normalized.baseNutritionPer100g?.fat).toBeCloseTo(0.6, 1);
    });

    it("should handle foods with optional nutrition fields", () => {
      const legacyFood: Partial<Food> = {
        id: "4",
        name: "Chicken Breast",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        sodium: 74,
        sugar: 0,
        saturatedFat: 1.0,
        servingSize: "100",
        servingSizeUnit: "g",
        category: "proteins",
        meal: ["lunch", "dinner"],
        servings: 1,
      };

      const normalized = normalizeFoodData(legacyFood as Food);

      expect(normalized.baseNutritionPer100g?.sodium).toBe(74);
      expect(normalized.baseNutritionPer100g?.sugar).toBe(0);
      expect(normalized.baseNutritionPer100g?.saturatedFat).toBe(1.0);
    });

    it("should handle foods with missing servingSize", () => {
      const legacyFood: Partial<Food> = {
        id: "5",
        name: "Unknown Food",
        calories: 100,
        protein: 1,
        carbs: 10,
        fat: 5,
        category: "other",
        meal: [],
        servings: 1,
      };

      const normalized = normalizeFoodData(legacyFood as Food);

      // Should use defaults
      expect(normalized.servingSizes).toBeDefined();
      expect(normalized.servingSizes).toHaveLength(1);
      expect(normalized.servingSizes![0].amount).toBe(1);
      expect(normalized.servingSizes![0].unit).toBe("piece");
    });

    it("should handle different unit types correctly", () => {
      const testCases = [
        { unit: "cup", amount: 1, expectedGrams: 240 },
        { unit: "tbsp", amount: 1, expectedGrams: 15 },
        { unit: "tsp", amount: 1, expectedGrams: 5 },
        { unit: "oz", amount: 1, expectedGrams: 28.35 },
      ];

      testCases.forEach(({ unit, amount, expectedGrams }) => {
        const food: Partial<Food> = {
          id: `test-${unit}`,
          name: `Test ${unit}`,
          calories: 100,
          protein: 1,
          carbs: 10,
          fat: 1,
          servingSize: String(amount),
          servingSizeUnit: unit as any,
          category: "other",
          meal: [],
          servings: 1,
        };

        const normalized = normalizeFoodData(food as Food);

        expect(normalized.servingSizes![0].gramsEquivalent).toBeCloseTo(
          expectedGrams,
          2
        );
      });
    });
  });

  describe("calculateNutritionForServing", () => {
    it("should calculate nutrition correctly for single serving", () => {
      const baseNutrition: NutritionInfo = {
        calories: 32,
        protein: 0.7,
        carbs: 7.7,
        fat: 0.3,
      };

      const result = calculateNutritionForServing(baseNutrition, 12, 1);

      // 12g is 12% of 100g
      expect(result.calories).toBeCloseTo(3.84, 1);
      expect(result.protein).toBeCloseTo(0.084, 2);
      expect(result.carbs).toBeCloseTo(0.924, 2);
      expect(result.fat).toBeCloseTo(0.036, 3);
    });

    it("should calculate nutrition correctly for multiple servings", () => {
      const baseNutrition: NutritionInfo = {
        calories: 32,
        protein: 0.7,
        carbs: 7.7,
        fat: 0.3,
      };

      const result = calculateNutritionForServing(baseNutrition, 12, 5);

      // 5 servings of 12g = 60g total = 60% of 100g
      expect(result.calories).toBeCloseTo(19.2, 1);
      expect(result.protein).toBeCloseTo(0.42, 2);
      expect(result.carbs).toBeCloseTo(4.62, 2);
      expect(result.fat).toBeCloseTo(0.18, 2);
    });

    it("should handle 100g serving (should equal base nutrition)", () => {
      const baseNutrition: NutritionInfo = {
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 2,
      };

      const result = calculateNutritionForServing(baseNutrition, 100, 1);

      expect(result.calories).toBeCloseTo(100, 0);
      expect(result.protein).toBeCloseTo(5, 1);
      expect(result.carbs).toBeCloseTo(15, 1);
      expect(result.fat).toBeCloseTo(2, 1);
    });

    it("should handle optional nutrition fields", () => {
      const baseNutrition: NutritionInfo = {
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 2,
        sodium: 200,
        sugar: 10,
        saturatedFat: 1.5,
      };

      const result = calculateNutritionForServing(baseNutrition, 50, 2);

      // 2 servings of 50g = 100g total
      expect(result.sodium).toBeCloseTo(200, 0);
      expect(result.sugar).toBeCloseTo(10, 1);
      expect(result.saturatedFat).toBeCloseTo(1.5, 1);
    });

    it("should handle fractional servings", () => {
      const baseNutrition: NutritionInfo = {
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
      };

      const result = calculateNutritionForServing(baseNutrition, 100, 0.5);

      // 0.5 servings of 100g = 50g total
      expect(result.calories).toBeCloseTo(50, 0);
      expect(result.protein).toBeCloseTo(5, 1);
      expect(result.carbs).toBeCloseTo(10, 1);
      expect(result.fat).toBeCloseTo(2.5, 1);
    });

    it("should handle large serving sizes", () => {
      const baseNutrition: NutritionInfo = {
        calories: 50,
        protein: 2,
        carbs: 10,
        fat: 1,
      };

      const result = calculateNutritionForServing(baseNutrition, 200, 3);

      // 3 servings of 200g = 600g total = 6x base nutrition
      expect(result.calories).toBeCloseTo(300, 0);
      expect(result.protein).toBeCloseTo(12, 1);
      expect(result.carbs).toBeCloseTo(60, 1);
      expect(result.fat).toBeCloseTo(6, 1);
    });
  });
});
