import { render, screen } from "@testing-library/react";
import { MealHistory } from "../MealHistory";
import { MealHistoryRecord, MealType } from "@/types/meals";

const mockHistoryData: MealHistoryRecord[] = [
  {
    _id: "1",
    kidId: "kid1",
    meal: "breakfast" as MealType,
    date: new Date(Date.UTC(2024, 1, 5, 8, 0, 0)), // Feb 5, 2024 08:00:00 UTC
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
      grains: null,
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [],
    },
    consumptionData: {
      percentEaten: 100,
      notes: "All food was eaten",
    },
  },
  {
    _id: "2",
    kidId: "kid1",
    meal: "lunch" as MealType,
    date: new Date(Date.UTC(2024, 1, 4, 12, 0, 0)), // Feb 4, 2024 12:00:00 UTC
    selections: {
      proteins: null,
      grains: null,
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [],
    },
  },
];

describe("MealHistory Integration", () => {
  beforeEach(() => {
    // Mock current date to Feb 5, 2024 12:00:00 UTC
    jest.useFakeTimers();
    const mockDate = new Date(Date.UTC(2024, 1, 5, 12, 0, 0));
    console.log("Setting mock date to:", mockDate.toISOString());
    jest.setSystemTime(mockDate);
    console.log("Current time after mock:", new Date().toISOString());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays meal history data correctly", () => {
    console.log("Mock history data dates:", {
      firstEntry: new Date(mockHistoryData[0].date).toISOString(),
      secondEntry: new Date(mockHistoryData[1].date).toISOString(),
    });

    render(<MealHistory historyEntries={mockHistoryData} />);

    // Check dates are displayed
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();

    // Check meal content
    expect(screen.getByText("Eggs")).toBeInTheDocument();
    expect(screen.getByText(/140 cal/)).toBeInTheDocument();
  });

  it("displays consumption data when available", () => {
    render(<MealHistory historyEntries={mockHistoryData} />);

    expect(screen.getByText("All food was eaten")).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("groups multiple meals on the same day correctly", () => {
    const multiMealData: MealHistoryRecord[] = [
      ...mockHistoryData,
      {
        _id: "3",
        kidId: "kid1",
        meal: "dinner" as MealType,
        date: new Date("2024-02-05T18:00:00.000Z"),
        selections: {
          proteins: {
            id: "2",
            name: "Chicken",
            calories: 150,
            protein: 25,
            carbs: 0,
            fat: 6,
            servings: 1,
            adjustedCalories: 150,
            adjustedProtein: 25,
            adjustedCarbs: 0,
            adjustedFat: 6,
            servingSize: "1",
            servingSizeUnit: "piece",
            category: "proteins",
            meal: ["dinner"],
          },
          grains: null,
          fruits: null,
          vegetables: null,
          milk: null,
          ranch: null,
          condiments: [],
        },
      },
    ];

    render(<MealHistory historyEntries={multiMealData} />);

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Eggs")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();
  });

  it("calculates daily totals correctly", () => {
    const multiMealData: MealHistoryRecord[] = [
      ...mockHistoryData,
      {
        _id: "3",
        kidId: "kid1",
        meal: "dinner" as MealType,
        date: new Date("2024-02-05T18:00:00.000Z"),
        selections: {
          proteins: {
            id: "2",
            name: "Chicken",
            calories: 150,
            protein: 25,
            carbs: 0,
            fat: 6,
            servings: 1,
            adjustedCalories: 150,
            adjustedProtein: 25,
            adjustedCarbs: 0,
            adjustedFat: 6,
            servingSize: "1",
            servingSizeUnit: "piece",
            category: "proteins",
            meal: ["dinner"],
          },
          grains: null,
          fruits: null,
          vegetables: null,
          milk: null,
          ranch: null,
          condiments: [],
        },
      },
    ];

    render(<MealHistory historyEntries={multiMealData} />);

    // Total calories for today: Eggs (140) + Chicken (150) = 290
    expect(screen.getByText(/290 \/ 1400 cal/)).toBeInTheDocument();
    expect(screen.getByText(/20.7% of daily goal/)).toBeInTheDocument();
  });

  it("handles empty history", () => {
    render(<MealHistory historyEntries={[]} />);
    expect(screen.getByText("No meal history available")).toBeInTheDocument();
  });
});
