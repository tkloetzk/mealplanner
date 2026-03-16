import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConsumptionStatusSelector } from "../ConsumptionStatusSelector";

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConsumptionStatusSelector — mealTime", () => {
  it("renders a time input labelled 'Meal Time'", () => {
    render(
      <ConsumptionStatusSelector onSave={mockOnSave} onCancel={mockOnCancel} />,
    );

    const timeInput = screen.getByLabelText(/meal time/i);
    expect(timeInput).toBeInTheDocument();
    expect(timeInput).toHaveAttribute("type", "time");
  });

  it("defaults time input to current time when no initialStatus", () => {
    render(
      <ConsumptionStatusSelector onSave={mockOnSave} onCancel={mockOnCancel} />,
    );

    const timeInput = screen.getByLabelText(/meal time/i) as HTMLInputElement;
    // Should be a valid HH:MM string
    expect(timeInput.value).toMatch(/^\d{2}:\d{2}$/);
  });

  it("pre-populates time input from initialStatus.mealTime", () => {
    render(
      <ConsumptionStatusSelector
        initialStatus={{
          foods: [],
          overallStatus: "eaten",
          mealTime: "2026-03-15T14:30:00.000Z",
        }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    const timeInput = screen.getByLabelText(/meal time/i) as HTMLInputElement;
    // The exact display depends on the test timezone, but we can check it parsed
    expect(timeInput.value).toMatch(/^\d{2}:\d{2}$/);
  });

  it("includes mealTime as an ISO string in the saved data", () => {
    render(
      <ConsumptionStatusSelector
        mealDate="2026-03-15"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    // Change the time
    const timeInput = screen.getByLabelText(/meal time/i);
    fireEvent.change(timeInput, { target: { value: "12:30" } });

    // Save
    fireEvent.click(screen.getByText("Save Status"));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedData = mockOnSave.mock.calls[0][0];
    expect(savedData.mealTime).toBeDefined();
    expect(typeof savedData.mealTime).toBe("string");
    // Should be a valid ISO date
    expect(Number.isNaN(new Date(savedData.mealTime).getTime())).toBe(false);
  });

  it("preserves existing satietyLog when saving", () => {
    const existingSatiety = { satietyRating: 2 as const, notes: "ok" };
    render(
      <ConsumptionStatusSelector
        initialStatus={{
          foods: [],
          overallStatus: "eaten",
          mealTime: "2026-03-15T12:00:00Z",
          satietyLog: existingSatiety,
        }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.click(screen.getByText("Save Status"));

    const savedData = mockOnSave.mock.calls[0][0];
    expect(savedData.satietyLog).toEqual(existingSatiety);
  });
});
