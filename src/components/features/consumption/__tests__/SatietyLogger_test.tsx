import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SatietyLogger } from "../SatietyLogger";
import type { SatietyEntry } from "@/types/shared";

const mockOnUpdate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SatietyLogger", () => {
  it("renders all three rating buttons", () => {
    render(<SatietyLogger mealTime="2026-03-15T12:00:00Z" onUpdate={mockOnUpdate} />);

    expect(screen.getByRole("button", { name: /hungry fast/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /moderate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stayed full/i })).toBeInTheDocument();
  });

  it("renders the 'Hungry Again Now' button when no hungryAgainAt exists", () => {
    render(<SatietyLogger mealTime="2026-03-15T12:00:00Z" onUpdate={mockOnUpdate} />);

    expect(screen.getByRole("button", { name: /hungry again now/i })).toBeInTheDocument();
  });

  it("hides the 'Hungry Again Now' button when hungryAgainAt already set", () => {
    render(
      <SatietyLogger
        mealTime="2026-03-15T12:00:00Z"
        existingLog={{ hungryAgainAt: "2026-03-15T13:00:00Z" }}
        onUpdate={mockOnUpdate}
      />,
    );

    expect(screen.queryByRole("button", { name: /hungry again now/i })).not.toBeInTheDocument();
  });

  it("calls onUpdate with satietyRating when a rating is tapped", () => {
    render(<SatietyLogger mealTime="2026-03-15T12:00:00Z" onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByRole("button", { name: /stayed full/i }));

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ satietyRating: 3 }),
    );
  });

  it("calls onUpdate with hungryAgainAt when 'Hungry Again Now' is tapped", () => {
    const before = Date.now();
    render(<SatietyLogger mealTime="2026-03-15T12:00:00Z" onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByRole("button", { name: /hungry again now/i }));

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    const entry = mockOnUpdate.mock.calls[0][0] as SatietyEntry;
    expect(entry.hungryAgainAt).toBeDefined();

    // The timestamp should be approximately "now"
    const ts = new Date(entry.hungryAgainAt!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("displays computed duration when mealTime and hungryAgainAt are both present", () => {
    render(
      <SatietyLogger
        mealTime="2026-03-15T12:00:00Z"
        existingLog={{ hungryAgainAt: "2026-03-15T13:30:00Z" }}
        onUpdate={mockOnUpdate}
      />,
    );

    expect(screen.getByTestId("satiety-duration")).toHaveTextContent("1h 30m");
  });

  it("pre-populates rating from existingLog", () => {
    render(
      <SatietyLogger
        mealTime="2026-03-15T12:00:00Z"
        existingLog={{ satietyRating: 2 }}
        onUpdate={mockOnUpdate}
      />,
    );

    const moderateBtn = screen.getByRole("button", { name: /moderate/i });
    expect(moderateBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders the fullness notes input", () => {
    render(<SatietyLogger mealTime="2026-03-15T12:00:00Z" onUpdate={mockOnUpdate} />);

    expect(screen.getByLabelText(/fullness notes/i)).toBeInTheDocument();
  });

  it("pre-populates notes from existingLog", () => {
    render(
      <SatietyLogger
        mealTime="2026-03-15T12:00:00Z"
        existingLog={{ notes: "wanted crackers" }}
        onUpdate={mockOnUpdate}
      />,
    );

    expect(screen.getByLabelText(/fullness notes/i)).toHaveValue("wanted crackers");
  });
});
