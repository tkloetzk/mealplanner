// src/services/meal/__tests__/mealService.test.ts
import { MealService } from "../mealService";
import { MealHistoryFilters } from "../mealTypes";
import { MOCK_KIDS } from "@/__mocks__/testConstants";

describe("MealService", () => {
  let mealService: MealService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Reset the fetch mock before each test
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Instantiate a fresh MealService for each test
    mealService = new MealService();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe("getMealHistory", () => {
    const validFilters: MealHistoryFilters = {
      kidId: MOCK_KIDS[0].id,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"),
      mealType: "breakfast",
    };

    it("should handle null or undefined filters", async () => {
      // Test null filters
      // @ts-expect-error: the point of test is to pass invalid type
      const nullFiltersResult = await mealService.getMealHistory(null);
      expect(nullFiltersResult).toEqual({
        success: false,
        error: "kidId is required",
      });

      // Test undefined filters
      const undefinedFiltersResult = await mealService.getMealHistory(
        // @ts-expect-error: the point of test is to pass invalid type
        undefined
      );
      expect(undefinedFiltersResult).toEqual({
        success: false,
        error: "kidId is required",
      });
    });

    it("should handle invalid kidId", async () => {
      // Test empty string kidId
      const emptyKidIdResult = await mealService.getMealHistory({
        kidId: "",
        startDate: validFilters.startDate,
        endDate: validFilters.endDate,
      });
      expect(emptyKidIdResult).toEqual({
        success: false,
        error: "kidId is required",
      });

      // Test non-string kidId
      const invalidKidIdResult = await mealService.getMealHistory({
        // @ts-expect-error: the point of test is to pass invalid type
        kidId: null,
        startDate: validFilters.startDate,
        endDate: validFilters.endDate,
      });
      expect(invalidKidIdResult).toEqual({
        success: false,
        error: "kidId is required",
      });
    });

    it("should handle fetch errors gracefully when no response", async () => {
      // Simulate a scenario where fetch fails to return a response
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await mealService.getMealHistory(validFilters);

      expect(result).toEqual({
        success: false,
        error: "Network error",
      });
    });

    it("should handle HTTP error responses", async () => {
      // Mock a 500 server error with JSON error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Internal Server Error" }),
      });

      const result = await mealService.getMealHistory(validFilters);

      expect(result).toEqual({
        success: false,
        error: "Internal Server Error",
      });

      // Mock a 500 server error without JSON parsing
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => {
          throw new Error("Cannot parse JSON");
        },
      });

      const fallbackResult = await mealService.getMealHistory(validFilters);

      expect(fallbackResult).toEqual({
        success: false,
        error: "HTTP error! status: 500",
      });
    });

    it("should fetch meal history successfully", async () => {
      const mockMealHistory = [
        {
          _id: "1",
          kidId: MOCK_KIDS[0].id,
          date: new Date(),
          meal: "breakfast",
          selections: {},
        },
      ];

      // Mock a successful fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMealHistory),
      });

      const result = await mealService.getMealHistory(validFilters);

      // Assert the result structure
      expect(result).toEqual({
        success: true,
        data: mockMealHistory,
      });
    });
  });
});
