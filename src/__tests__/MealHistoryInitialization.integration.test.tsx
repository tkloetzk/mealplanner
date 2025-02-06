import { render, waitFor } from "@testing-library/react";
import { MealPlanner } from "@/components/features/meals/MealPlanner";
import { useMealStore } from "@/store/useMealStore";
import { startOfDay, format } from "date-fns";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";

describe("Meal History Initialization", () => {
  beforeEach(() => {
    // Reset store state
    useMealStore.setState({
      selections: {
        "1": structuredClone(DEFAULT_MEAL_PLAN), // Initialize with default meal plan for kid 1
      },
      selectedKid: "1",
      selectedDay: "monday",
      selectedMeal: "breakfast",
      mealHistory: {},
    });

    // Mock current date to be a Monday
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 1, 5, 12, 0, 0)); // A Monday
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it.skip("loads selections from history on initial render", async () => {
    const mockFoodOptions = {
      proteins: [
        {
          id: "1",
          name: "Eggs",
          calories: 70,
          protein: 6,
          carbs: 0,
          fat: 5,
          category: "proteins",
          meal: ["breakfast"],
          servingSize: "1",
          servingSizeUnit: "piece",
          servings: 1,
          adjustedCalories: 70,
          adjustedProtein: 6,
          adjustedCarbs: 0,
          adjustedFat: 5,
        },
      ],
      grains: [],
      fruits: [],
      vegetables: [],
      milk: [],
      ranch: [],
      condiments: [],
    };

    // Create a date that matches the current Monday
    const currentDate = new Date(2024, 1, 5, 12, 0, 0);
    const mockHistory = {
      history: [
        {
          _id: "1",
          kidId: "1",
          meal: "breakfast",
          date: currentDate.toISOString(),
          selections: {
            proteins: {
              id: "1",
              name: "Eggs",
              calories: 70,
              protein: 6,
              carbs: 0,
              fat: 5,
              category: "proteins",
              meal: ["breakfast"],
              servings: 2,
              adjustedCalories: 140,
              adjustedProtein: 12,
              adjustedCarbs: 0,
              adjustedFat: 10,
            },
            grains: null,
            fruits: null,
            vegetables: null,
            milk: null,
            ranch: null,
            condiments: [],
          },
        },
      ],
    };

    // Mock API responses
    const mockFetch = jest.fn().mockImplementation((url) => {
      console.log("Mock fetch called with URL:", url);
      if (url.includes("/api/foods")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFoodOptions),
        });
      }
      // Handle both meal history URL patterns
      if (
        url.includes("/api/meal-history") ||
        url.includes("/api/meals/history")
      ) {
        console.log(
          "Returning mock history:",
          JSON.stringify(mockHistory, null, 2)
        );
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHistory),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    global.fetch = mockFetch;

    render(<MealPlanner />);

    // Wait for loading state to finish and fetch calls to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/foods")
      );
      // Check for either URL pattern
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/(meal|meals)(-|\/)history/)
      );
    });

    // Verify selections are loaded from history
    await waitFor(
      () => {
        const store = useMealStore.getState();
        console.log("Current store state:", JSON.stringify(store, null, 2));
        const currentSelections = store.selections["1"]?.monday?.breakfast;
        console.log(
          "Current selections:",
          JSON.stringify(currentSelections, null, 2)
        );

        expect(currentSelections).toBeDefined();
        expect(currentSelections?.proteins).toBeDefined();
        expect(currentSelections?.proteins?.name).toBe("Eggs");
        expect(currentSelections?.proteins?.servings).toBe(2);
        expect(currentSelections?.proteins?.adjustedCalories).toBe(140);
      },
      { timeout: 5000 }
    );
  });

  it("handles no history data gracefully", async () => {
    const mockFetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/foods")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              proteins: [],
              grains: [],
              fruits: [],
              vegetables: [],
              milk: [],
              ranch: [],
              condiments: [],
            }),
        });
      }
      // Handle both meal history URL patterns
      if (
        url.includes("/api/meal-history") ||
        url.includes("/api/meals/history")
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ history: [] }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    global.fetch = mockFetch;

    render(<MealPlanner />);

    // Wait for fetch calls to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/foods")
      );
      // Check for either URL pattern
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/(meal|meals)(-|\/)history/)
      );
    });

    // Verify store keeps default meal plan when no history is found
    await waitFor(() => {
      const store = useMealStore.getState();
      expect(store.selections["1"]?.monday?.breakfast).toEqual(
        DEFAULT_MEAL_PLAN.monday.breakfast
      );
    });
  });
});
