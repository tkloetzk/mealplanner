import { render, waitFor } from "@testing-library/react";
import { MealPlanner } from "@/components/features/meals/MealPlanner";
import { useMealStore } from "@/store/useMealStore";
import { startOfDay } from "date-fns";

describe("Meal History Initialization", () => {
  beforeEach(() => {
    // Reset store state
    const { initializeKids } = useMealStore.getState();
    useMealStore.setState({
      selections: {},
      selectedKid: "1",
      selectedDay: "monday",
      selectedMeal: "breakfast",
      mealHistory: {},
    });
    initializeKids([
      { id: "1", name: "Test Kid" },
      { id: "2", name: "Evy" },
    ]);

    // Mock current date
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 1, 5, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads selections from history on initial render", async () => {
    // Mock API response for meal history
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          history: [
            {
              _id: "1",
              kidId: "1",
              meal: "breakfast",
              date: startOfDay(new Date()).toISOString(),
              selections: {
                proteins: {
                  id: "1",
                  name: "Eggs",
                  calories: 70,
                  servings: 2,
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
            },
          ],
        }),
    });

    render(<MealPlanner />);

    // Verify selections are loaded from history
    await waitFor(() => {
      const store = useMealStore.getState();
      const currentSelections = store.selections?.monday?.breakfast;
      expect(currentSelections?.proteins?.name).toBe("Eggs");
      expect(currentSelections?.proteins?.servings).toBe(2);
    });
  });

  it("handles no history data gracefully", async () => {
    // Mock empty history response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ history: [] }),
    });

    render(<MealPlanner />);

    // Verify store has empty selections
    await waitFor(() => {
      const store = useMealStore.getState();
      expect(store.selections?.monday?.breakfast).toBeUndefined();
    });
  });
});
