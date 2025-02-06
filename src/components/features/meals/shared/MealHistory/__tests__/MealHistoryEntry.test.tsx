import { render, screen } from "@testing-library/react";
import { MealHistoryEntry } from "../MealHistoryEntry";
import { MealHistoryRecord } from "@/types/meals";

describe("MealHistoryEntry", () => {
  const mockEntry: MealHistoryRecord = {
    _id: "1",
    kidId: "kid1",
    meal: "breakfast",
    date: new Date("2024-02-05T08:00:00.000Z"),
    selections: {
      proteins: {
        id: "1",
        name: "Eggs",
        calories: 70,
        protein: 6,
        carbs: 0,
        fat: 5,
        servings: 2,
        adjustedCalories: 140,
        adjustedProtein: 12,
        adjustedCarbs: 0,
        adjustedFat: 10,
        servingSize: "1",
        servingSizeUnit: "piece",
        category: "proteins",
        meal: ["breakfast"],
      },
      grains: {
        id: "2",
        name: "Toast",
        calories: 80,
        protein: 3,
        carbs: 15,
        fat: 1,
        servings: 1,
        adjustedCalories: 80,
        adjustedProtein: 3,
        adjustedCarbs: 15,
        adjustedFat: 1,
        servingSize: "1",
        servingSizeUnit: "piece",
        category: "grains",
        meal: ["breakfast"],
      },
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [
        {
          id: "3",
          name: "Butter",
          calories: 100,
          protein: 0,
          carbs: 0,
          fat: 11,
          servings: 1,
          adjustedCalories: 100,
          adjustedProtein: 0,
          adjustedCarbs: 0,
          adjustedFat: 11,
          servingSize: "1",
          servingSizeUnit: "tbsp",
          category: "condiments",
          meal: ["breakfast"],
        },
      ],
    },
    consumptionData: {
      percentEaten: 100,
      notes: "All food was eaten",
    },
  };

  it("displays meal information correctly", () => {
    render(<MealHistoryEntry entries={[mockEntry]} />);

    // Check meal name is displayed
    expect(screen.getByText("Breakfast")).toBeInTheDocument();

    // Check food items are displayed
    expect(screen.getByText("Eggs")).toBeInTheDocument();
    expect(screen.getByText("Toast")).toBeInTheDocument();
    expect(screen.getByText("Butter")).toBeInTheDocument();

    // Check serving information
    expect(screen.getByText("2 serving(s) • 140 cal")).toBeInTheDocument();
    expect(screen.getByText("1 serving(s) • 80 cal")).toBeInTheDocument();
    expect(screen.getByText("1 serving(s) • 100 cal")).toBeInTheDocument();
  });

  it("displays consumption data", () => {
    render(<MealHistoryEntry entries={[mockEntry]} />);

    expect(screen.getByText("100% eaten")).toBeInTheDocument();
    expect(screen.getByText("All food was eaten")).toBeInTheDocument();
  });

  it("calculates and displays total calories correctly", () => {
    render(<MealHistoryEntry entries={[mockEntry]} />);

    // Total calories: Eggs (140) + Toast (80) + Butter (100) = 320
    expect(screen.getByText("320 / 400 cal")).toBeInTheDocument();
    expect(screen.getByText("80.0% of target")).toBeInTheDocument();
  });

  it("handles empty meal selections", () => {
    const emptyEntry: MealHistoryRecord = {
      _id: "2",
      kidId: "kid1",
      meal: "lunch",
      date: new Date("2024-02-05T12:00:00.000Z"),
      selections: {
        proteins: null,
        grains: null,
        fruits: null,
        vegetables: null,
        milk: null,
        ranch: null,
        condiments: [],
      },
    };

    render(<MealHistoryEntry entries={[emptyEntry]} />);
    expect(screen.getByText("0 / 400 cal")).toBeInTheDocument();
  });
});
