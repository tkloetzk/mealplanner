import { render, screen, cleanup } from "@testing-library/react";
import { MealHistory } from "../MealHistory";
import { MealHistoryRecord } from "@/types/meals";
import { ServingSizeUnit } from "@/types/food";
import { startOfDay } from "date-fns";

describe("MealHistory", () => {
  beforeEach(() => {
    // Set timezone to UTC to avoid any timezone issues
    process.env.TZ = "UTC";

    // Mock current date to Feb 5, 2024 12:00:00 UTC
    const mockDate = new Date(Date.UTC(2024, 1, 5, 12, 0, 0));
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Debug log
    console.log("System time set to:", mockDate.toISOString());
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  const mockHistoryEntries: MealHistoryRecord[] = [
    {
      _id: "1",
      kidId: "kid1",
      meal: "breakfast",
      // Set to same day as system time
      date: new Date(Date.UTC(2024, 1, 5, 8, 0, 0)),
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
          servingSizeUnit: "piece" as ServingSizeUnit,
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
    {
      _id: "2",
      kidId: "kid1",
      meal: "lunch",
      // Set to previous day
      date: new Date(Date.UTC(2024, 1, 4, 12, 0, 0)),
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

  it("renders without crashing", () => {
    render(<MealHistory historyEntries={[]} />);
    expect(screen.getByText("No meal history available")).toBeInTheDocument();
  });

  it("displays meal history entries grouped by date", () => {
    render(<MealHistory historyEntries={mockHistoryEntries} />);

    // Debug log the dates
    mockHistoryEntries.forEach((entry) => {
      console.log("Entry date:", new Date(entry.date).toISOString());
      console.log(
        "Entry start of day:",
        startOfDay(new Date(entry.date)).toISOString()
      );
    });

    // Check for date headers
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("sorts entries by date in descending order", () => {
    render(<MealHistory historyEntries={mockHistoryEntries} />);

    // Get date headers using test IDs
    const todayHeader = screen.getByTestId("date-header-today");
    const yesterdayHeader = screen.getByTestId("date-header-yesterday");

    // Debug log
    console.log("Date headers found:", {
      today: todayHeader.textContent,
      yesterday: yesterdayHeader.textContent,
    });

    expect(todayHeader).toHaveTextContent("Today");
    expect(yesterdayHeader).toHaveTextContent("Yesterday");

    // Verify order
    const headers = screen.getAllByRole("heading", { level: 3 });
    expect(headers.indexOf(todayHeader)).toBeLessThan(
      headers.indexOf(yesterdayHeader)
    );
  });

  it("handles invalid dates gracefully", () => {
    const entriesWithInvalidDate = [
      {
        ...mockHistoryEntries[0],
        date: "invalid-date" as unknown as Date,
      },
    ];

    render(<MealHistory historyEntries={entriesWithInvalidDate} />);
    expect(screen.getByText("No meal history available")).toBeInTheDocument();
  });

  it("handles empty history entries", () => {
    render(<MealHistory historyEntries={[]} />);
    expect(screen.getByText("No meal history available")).toBeInTheDocument();
  });

  it("handles null history entries", () => {
    // @ts-expect-error Testing invalid input
    render(<MealHistory historyEntries={null} />);
    expect(screen.getByText("No meal history available")).toBeInTheDocument();
    cleanup();
  });

  it("handles undefined history entries", () => {
    // @ts-expect-error Testing invalid input
    render(<MealHistory historyEntries={undefined} />);
    expect(screen.getByText("No meal history available")).toBeInTheDocument();
    cleanup();
  });
});
