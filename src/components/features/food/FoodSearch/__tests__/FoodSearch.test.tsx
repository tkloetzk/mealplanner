// src/components/features/food/FoodSearch/__tests__/FoodSearch.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FoodSearch } from "../FoodSearch";
import type { FoodSearchResponse } from "@/types/foodSearch";

// ── Mocks ────────────────────────────────────────────────────────────

const mockOnFoodFound = jest.fn();
const mockOnError = jest.fn();
const mockOnScanRequest = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const emptyResponse: FoodSearchResponse = {
  results: [],
  aiAvailable: false,
};

const searchResponseWithResults: FoodSearchResponse = {
  results: [
    {
      id: "local-1",
      source: "local",
      name: "Grilled Chicken Breast",
      nutrition: { calories: 200, protein: 30, carbs: 0, fat: 8 },
      confidence: "exact",
      image: "https://example.com/chicken.jpg",
    },
    {
      id: "3017624010701",
      source: "openfoodfacts",
      name: "Tyson Chicken Tenders",
      nutrition: { calories: 250, protein: 18, carbs: 15, fat: 12 },
      confidence: "exact",
    },
  ],
  aiAvailable: true,
};

function mockFetch(responses: Record<string, { ok: boolean; json: () => Promise<unknown> }>) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve(response);
      }
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Not found" }) });
  });
}

// ── Tests ────────────────────────────────────────────────────────────

describe("FoodSearch", () => {
  describe("rendering", () => {
    it("renders the search input and button", () => {
      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    });

    it("renders the scan button when onScanRequest is provided", () => {
      render(
        <FoodSearch
          onFoodFound={mockOnFoodFound}
          onError={mockOnError}
          onScanRequest={mockOnScanRequest}
        />
      );

      expect(screen.getByRole("button", { name: /scan barcode/i })).toBeInTheDocument();
    });

    it("does not render scan button without onScanRequest", () => {
      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      expect(screen.queryByRole("button", { name: /scan barcode/i })).not.toBeInTheDocument();
    });
  });

  describe("text search", () => {
    it("calls /api/foods/search with the query and displays grouped results", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () => Promise.resolve(searchResponseWithResults),
        },
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      await user.type(screen.getByRole("combobox"), "chicken");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
        expect(screen.getByText("Tyson Chicken Tenders")).toBeInTheDocument();
      });

      // Source group headers
      expect(screen.getByText("Your Foods")).toBeInTheDocument();
      expect(screen.getByText("Open Food Facts")).toBeInTheDocument();

      // Nutrition previews
      expect(screen.getByText("200 cal · 30g protein")).toBeInTheDocument();

      // AI option at bottom
      expect(
        screen.getByText(/Get AI estimate for "chicken"/)
      ).toBeInTheDocument();
    });

    it("disables search button when input is empty", () => {
      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();
    });

    it("shows error when search fails", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      await user.type(screen.getByRole("combobox"), "chicken");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith("Search failed. Please try again.");
      });
    });
  });

  describe("selecting a result", () => {
    it("calls onFoodFound with normalized food when result has nutrition", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () => Promise.resolve(searchResponseWithResults),
        },
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      await user.type(screen.getByRole("combobox"), "chicken");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Grilled Chicken Breast"));

      expect(mockOnFoodFound).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Grilled Chicken Breast",
          calories: 200,
          protein: 30,
        }),
        "local"
      );
    });
  });

  describe("UPC detection", () => {
    it("routes to /api/upc for numeric-only input of 8-14 digits", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () =>
            Promise.resolve({
              id: "016000275287",
              source: "openfoodfacts",
              name: "Cheerios",
              nutrition: { calories: 100, protein: 3, carbs: 20, fat: 2 },
              confidence: "exact",
            }),
        },
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      await user.type(screen.getByRole("combobox"), "016000275287");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/foods/search?id=016000275287")
        );
        expect(mockOnFoodFound).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Cheerios" }),
          "openfoodfacts"
        );
      });
    });
  });

  describe("AI estimation", () => {
    it("triggers AI estimate when user clicks the AI button", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () => Promise.resolve({ results: [], aiAvailable: true }),
        },
        "/api/foods/estimate": {
          ok: true,
          json: () =>
            Promise.resolve({
              id: "ai-123",
              source: "ai",
              name: "Grilled Salmon",
              nutrition: { calories: 350, protein: 34, carbs: 0, fat: 22 },
              servingSize: "170",
              servingSizeUnit: "g",
              category: "proteins",
              confidence: "estimated",
            }),
        },
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      // First search with no results
      await user.type(screen.getByRole("combobox"), "grilled salmon");
      await user.click(screen.getByRole("button", { name: /search/i }));

      // Auto-estimates since no results and AI is available
      await waitFor(() => {
        expect(mockOnFoodFound).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Grilled Salmon",
            calories: 350,
          }),
          "ai"
        );
      });
    });

    it("handles 429 quota error gracefully", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () => Promise.resolve({ ...emptyResponse, aiAvailable: true }),
        },
        "/api/foods/estimate": {
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: "quota exceeded" }),
        },
      });

      // Override fetch to properly set status
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/foods/search")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ results: [], aiAvailable: true }),
          });
        }
        if (url.includes("/api/foods/estimate")) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ error: "quota exceeded" }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      await user.type(screen.getByRole("combobox"), "salmon");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(mockOnFoodFound).toHaveBeenCalledWith(
          expect.objectContaining({ name: "salmon", calories: 0 }),
          "ai"
        );
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining("quota exceeded")
        );
      });
    });
  });

  describe("keyboard navigation", () => {
    it("allows navigating results with arrow keys and selecting with Enter", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () => Promise.resolve(searchResponseWithResults),
        },
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      const input = screen.getByRole("combobox");
      await user.type(input, "chicken");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
      });

      // Navigate down to first result
      await user.keyboard("{ArrowDown}");
      // Select it
      await user.keyboard("{Enter}");

      expect(mockOnFoodFound).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Grilled Chicken Breast" }),
        "local"
      );
    });

    it("closes results on Escape", async () => {
      const user = userEvent.setup();
      mockFetch({
        "/api/foods/search": {
          ok: true,
          json: () => Promise.resolve(searchResponseWithResults),
        },
      });

      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      await user.type(screen.getByRole("combobox"), "chicken");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes on the combobox", () => {
      render(
        <FoodSearch onFoodFound={mockOnFoodFound} onError={mockOnError} />
      );

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveAttribute("aria-controls", "food-search-results");
    });
  });
});
