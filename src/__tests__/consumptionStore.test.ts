import { act, renderHook } from "@testing-library/react";
import { useMealStore } from "@/store/useMealStore";
import { ConsumptionInfo } from "@/types/shared";

// Mock fetch globally
global.fetch = jest.fn();

describe("useMealStore consumption functionality", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store before each test
    const store = useMealStore.getState();
    useMealStore.setState({
      ...store,
      mealHistory: {},
      selectedKid: "1",
      selectedDay: "monday",
      selectedMeal: "breakfast",
    });
  });

  describe("updateConsumptionData", () => {
    it("should update consumption data in both local state and server", async () => {
      const mockConsumptionData: ConsumptionInfo = {
        foods: [
          {
            foodId: "test-food-1",
            status: "eaten",
            percentageEaten: 100,
            notes: "Ate everything",
          }
        ],
        overallStatus: "eaten",
        notes: "Ate everything",
      };

      // Mock successful fetch response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useMealStore());
      await act(async () => {
        await result.current.updateConsumptionData(
          "1",
          new Date("2023-01-01"),
          "breakfast",
          mockConsumptionData
        );
      });

      // Check that state was updated
      const state = result!.current;
      expect(state.mealHistory["1"]).toBeDefined();
      const historyEntry = state.mealHistory["1"].find(
        record => record.meal === "breakfast" &&
                  record.kidId === "1"
      );

      expect(historyEntry).toBeDefined();
      expect(historyEntry?.consumptionData).toEqual(mockConsumptionData);
      
      // Check that fetch was called with correct data
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/meal-history",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kidId: "1",
            mealData: {
              date: new Date("2023-01-01").toISOString(),
              meal: "breakfast",
              selections: {
                proteins: [],
                fruits: [],
                vegetables: [],
                grains: [],
                milk: null,
                ranch: null,
                condiments: [],
                other: [],
              },
              consumptionData: mockConsumptionData
            }
          }),
        })
      );
    });

    it("should handle API failure gracefully", async () => {
      const mockConsumptionData: ConsumptionInfo = {
        foods: [
          {
            foodId: "test-food-1",
            status: "partially_eaten",
            percentageEaten: 50,
            notes: "Some food left",
          }
        ],
        overallStatus: "partially_eaten",
        notes: "Some food left",
      };

      // Mock failed fetch response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Failed to update consumption" }),
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useMealStore());
      await act(async () => {
        await expect(
          result.current.updateConsumptionData(
            "1",
            new Date("2023-01-01"),
            "lunch",
            mockConsumptionData
          )
        ).rejects.toThrow();
      });

      consoleSpy.mockRestore();
    });

    it("should update existing history record if found", async () => {
      // Set up some initial history data
      const { result } = renderHook(() => useMealStore());

      await act(async () => {
        // Add initial record to state
        result.current.initializeKids([{ id: "1", name: "Test Kid" }]);
      });

      const mockConsumptionData: ConsumptionInfo = {
        foods: [
          {
            foodId: "test-food-1",
            status: "not_eaten",
            notes: "Offered but not eaten",
          }
        ],
        overallStatus: "offered",
        notes: "Offered but not eaten",
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await act(async () => {
        await result.current.updateConsumptionData(
          "1",
          new Date("2023-01-01"),
          "breakfast",
          mockConsumptionData
        );
      });

      const state = result.current;
      expect(state.mealHistory["1"]).toBeDefined();
      const historyEntry = state.mealHistory["1"].find(
        record => record.kidId === "1" && record.meal === "breakfast"
      );

      expect(historyEntry?.consumptionData).toEqual(mockConsumptionData);
    });

    describe("updateFoodConsumptionStatus", () => {
      it("should update individual food consumption status", async () => {
        const { result } = renderHook(() => useMealStore());

        // Mock successful fetch response
        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

        await act(async () => {
          await result.current.updateFoodConsumptionStatus(
            "1",
            new Date("2023-01-01"),
            "breakfast",
            "food-123",
            "eaten",
            100,
            "Child ate all of this food"
          );
        });

        // Check that state was updated
        const state = result.current;
        expect(state.mealHistory["1"]).toBeDefined();
        const historyEntry = state.mealHistory["1"].find(
          record => record.meal === "breakfast" &&
                    record.kidId === "1"
        );

        expect(historyEntry).toBeDefined();
        expect(historyEntry?.consumptionData).toBeDefined();
        expect(historyEntry?.consumptionData?.foods).toContainEqual({
          foodId: "food-123",
          status: "eaten",
          percentageEaten: 100,
          notes: "Child ate all of this food"
        });
      });

      it("should calculate overall status based on individual food statuses", async () => {
        const { result } = renderHook(() => useMealStore());

        // Mock successful fetch response
        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

        await act(async () => {
          // Add first food as eaten
          await result.current.updateFoodConsumptionStatus(
            "1",
            new Date("2023-01-01"),
            "breakfast",
            "food-1",
            "eaten",
            100
          );

          // Add second food as not eaten
          await result.current.updateFoodConsumptionStatus(
            "1",
            new Date("2023-01-01"),
            "breakfast",
            "food-2",
            "not_eaten"
          );
        });

        // Check that overall status is partially eaten since we have both eaten and not eaten foods
        const state = result.current;
        const historyEntry = state.mealHistory["1"].find(
          record => record.meal === "breakfast" &&
                    record.kidId === "1"
        );

        expect(historyEntry?.consumptionData?.overallStatus).toBe("partially_eaten");
      });
    });
  });
});