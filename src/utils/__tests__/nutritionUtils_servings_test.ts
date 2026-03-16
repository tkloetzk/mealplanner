import { computeMealNutrition } from "../nutritionUtils";
import type { MealSelection } from "@/types/meals";
import type { SelectedFood } from "@/types/food";

/**
 * Helper: builds a minimal SelectedFood with the fields computeMealNutrition reads.
 */
function makeFood(overrides: Partial<SelectedFood> & { id: string }): SelectedFood {
  const servings = overrides.servings ?? 1;
  return {
    name: "Test Food",
    category: "proteins",
    meal: ["lunch"],
    servings,
    calories: overrides.calories ?? 0,
    protein: overrides.protein ?? 0,
    carbs: overrides.carbs ?? 0,
    fat: overrides.fat ?? 0,
    adjustedCalories: (overrides.calories ?? 0) * servings,
    adjustedProtein: (overrides.protein ?? 0) * servings,
    adjustedCarbs: (overrides.carbs ?? 0) * servings,
    adjustedFat: (overrides.fat ?? 0) * servings,
    ...overrides,
  } as SelectedFood;
}

function emptyMeal(overrides: Partial<MealSelection> = {}): MealSelection {
  return {
    proteins: [],
    fruits: [],
    vegetables: [],
    grains: [],
    milk: null,
    ranch: null,
    condiments: [],
    other: [],
    ...overrides,
  };
}

describe("computeMealNutrition – extended nutrients scale with servings", () => {
  it("scales sodium by servings (the bug that was fixed)", () => {
    const chicken = makeFood({
      id: "chicken",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      sodium: 74,
      servings: 2,
    });

    const result = computeMealNutrition(emptyMeal({ proteins: [chicken] }));

    // Core four should use adjustedCalories (already 165 * 2 = 330)
    expect(result.calories).toBe(330);
    // Sodium should be 74 * 2 = 148, NOT 74
    expect(result.sodium).toBe(148);
  });

  it("scales all extended nutrients by servings", () => {
    const food = makeFood({
      id: "food",
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      sodium: 200,
      sugar: 12,
      saturatedFat: 3,
      fiber: 4,
      transFat: 0.5,
      cholesterol: 30,
      servings: 3,
    });

    const result = computeMealNutrition(emptyMeal({ proteins: [food] }));

    expect(result.calories).toBe(300);
    expect(result.protein).toBe(30);
    expect(result.sodium).toBe(600);
    expect(result.sugar).toBe(36);
    expect(result.saturatedFat).toBe(9);
    expect(result.fiber).toBe(12);
    expect(result.transFat).toBe(2);  // 0.5 * 3 rounded
    expect(result.cholesterol).toBe(90);
  });

  it("scales condiment extended nutrients by servings", () => {
    const ketchup = makeFood({
      id: "ketchup",
      calories: 20,
      protein: 0,
      carbs: 5,
      fat: 0,
      sodium: 160,
      sugar: 4,
      servings: 2,
    });

    const result = computeMealNutrition(
      emptyMeal({ condiments: [ketchup] })
    );

    expect(result.sodium).toBe(320);
    expect(result.sugar).toBe(8);
  });

  it("applies both servings and consumption multiplier correctly", () => {
    const food = makeFood({
      id: "food1",
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      sodium: 200,
      servings: 2,
    });

    const result = computeMealNutrition(
      emptyMeal({ proteins: food }),
      [{ foodId: "food1", status: "partially_eaten", percentageEaten: 50 }]
    );

    // adjustedCalories = 100*2 = 200, then 50% eaten → 100
    expect(result.calories).toBe(100);
    // sodium = 200 * 2 servings * 0.5 eaten = 200
    expect(result.sodium).toBe(200);
  });

  it("defaults servings to 1 when not set", () => {
    const food = makeFood({
      id: "food",
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      sodium: 150,
    });
    // Explicitly remove servings to test the ?? 1 fallback
    delete (food as Record<string, unknown>).servings;

    const result = computeMealNutrition(emptyMeal({ proteins: [food] }));

    expect(result.sodium).toBe(150);
  });

  it("sums extended nutrients across multiple categories", () => {
    const protein = makeFood({
      id: "p",
      calories: 100,
      protein: 20,
      carbs: 0,
      fat: 2,
      sodium: 80,
      servings: 1,
    });
    const grain = makeFood({
      id: "g",
      category: "grains",
      calories: 150,
      protein: 3,
      carbs: 30,
      fat: 1,
      sodium: 200,
      servings: 2,
    });

    const result = computeMealNutrition(
      emptyMeal({ proteins: protein, grains: grain })
    );

    // 80*1 + 200*2 = 480
    expect(result.sodium).toBe(480);
  });
});
