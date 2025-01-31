// src/components/features/nutrition/NutritionSummary/__tests__/NutritionSummary.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { NutritionSummary } from "../NutritionSummary";
import { DAILY_GOALS } from "@/constants/meal-goals";

describe("NutritionSummary", () => {
  // Test data
  const mealSelections = {
    proteins: {
      id: "1",
      name: "Chicken",
      calories: 200,
      protein: 25,
      carbs: 0,
      fat: 12,
      servings: 1,
      adjustedCalories: 200,
      adjustedProtein: 25,
      adjustedCarbs: 0,
      adjustedFat: 12,
      category: "proteins",
      servingSize: "1",
      servingSizeUnit: "piece",
      meal: ["breakfast", "lunch", "dinner"],
    },
    fruits: null,
    vegetables: null,
    grains: null,
    milk: null,
    ranch: null,
    condiments: [],
  };

  const dailySelections = {
    proteins: {
      ...mealSelections.proteins,
      calories: 600,
      protein: 75,
      carbs: 0,
      fat: 36,
      adjustedCalories: 600,
      adjustedProtein: 75,
      adjustedCarbs: 0,
      adjustedFat: 36,
    },
    fruits: null,
    vegetables: null,
    grains: null,
    milk: null,
    ranch: null,
    condiments: [],
  };

  it("displays basic nutrition information correctly", () => {
    render(
      <NutritionSummary
        mealSelections={mealSelections}
        dailySelections={dailySelections}
        selectedMeal="breakfast"
      />
    );

    // Check nutrient values are displayed
    expect(screen.getByText(/200/)).toBeInTheDocument(); // Calories
    expect(screen.getByText(/25\.0g/)).toBeInTheDocument(); // Protein
    expect(screen.getByText(/0\.0g/)).toBeInTheDocument(); // Carbs
    expect(screen.getByText(/12\.0g/)).toBeInTheDocument(); // Fat

    // Check meal title is displayed correctly
    expect(screen.getByText("Breakfast Total")).toBeInTheDocument();
  });

  it("toggles between meal and daily view correctly", () => {
    render(
      <NutritionSummary
        mealSelections={mealSelections}
        dailySelections={dailySelections}
        selectedMeal="breakfast"
      />
    );

    // Check initial meal view
    expect(screen.getByText(/200/)).toBeInTheDocument();
    expect(screen.getByText("Breakfast Total")).toBeInTheDocument();

    // Toggle to daily view
    fireEvent.click(screen.getByText("Nutrition Summary"));

    // Check daily view values
    expect(screen.getByText(/600/)).toBeInTheDocument();
    expect(screen.getByText("Daily Total")).toBeInTheDocument();
  });

  it("shows correct goal ranges in daily view", () => {
    render(
      <NutritionSummary
        mealSelections={mealSelections}
        dailySelections={dailySelections}
        selectedMeal="breakfast"
      />
    );

    // Switch to daily view
    fireEvent.click(screen.getByText("Nutrition Summary"));

    // Check target ranges are displayed
    const proteinRange = `${DAILY_GOALS.dailyTotals.protein.min}-${DAILY_GOALS.dailyTotals.protein.max}g`;
    const fatRange = `${DAILY_GOALS.dailyTotals.fat.min}-${DAILY_GOALS.dailyTotals.fat.max}g`;

    expect(screen.getByText(`Target: ${proteinRange}`)).toBeInTheDocument();
    expect(screen.getByText(`Target: ${fatRange}`)).toBeInTheDocument();
  });

  it("handles empty selections gracefully", () => {
    const emptySelections = {
      proteins: null,
      fruits: null,
      vegetables: null,
      grains: null,
      milk: null,
      ranch: null,
      condiments: [],
    };

    render(
      <NutritionSummary
        mealSelections={emptySelections}
        dailySelections={emptySelections}
        selectedMeal="breakfast"
      />
    );

    // Check that zero values are displayed
    expect(screen.getByText(/0 \//)).toBeInTheDocument();
    expect(screen.getByText(/0\.0g/)).toBeInTheDocument();
  });

  it("displays condiment nutrition when present", () => {
    const selectionsWithCondiments = {
      ...mealSelections,
      condiments: [
        {
          foodId: "1",
          servings: 1,
          adjustedCalories: 50,
          adjustedProtein: 0,
          adjustedCarbs: 5,
          adjustedFat: 3,
        },
      ],
    };

    render(
      <NutritionSummary
        mealSelections={selectionsWithCondiments}
        dailySelections={dailySelections}
        selectedMeal="breakfast"
      />
    );

    // Check total includes condiments
    expect(screen.getByText(/250/)).toBeInTheDocument(); // 200 + 50 calories
    expect(screen.getByText(/5\.0g/)).toBeInTheDocument(); // Carbs from condiment
  });

  it("maintains UI state when switching meals", () => {
    const { rerender } = render(
      <NutritionSummary
        mealSelections={mealSelections}
        dailySelections={dailySelections}
        selectedMeal="breakfast"
      />
    );

    // Switch to daily view
    fireEvent.click(screen.getByText("Nutrition Summary"));
    expect(screen.getByText("Daily Total")).toBeInTheDocument();

    // Change meal
    rerender(
      <NutritionSummary
        mealSelections={mealSelections}
        dailySelections={dailySelections}
        selectedMeal="lunch"
      />
    );

    // Daily view should still be active
    expect(screen.getByText("Daily Total")).toBeInTheDocument();
  });
});
