import { render, screen } from "@testing-library/react";
import { ConsumptionAnalysis } from "./ConsumptionAnalysis";

const mockData = {
  foods: [
    { name: "Apple", percentageEaten: 50, notes: "Fresh and juicy" },
    { name: "Banana", percentageEaten: 75 },
  ],
  summary: "Overall good consumption",
};

describe("ConsumptionAnalysis Component", () => {
  it("renders the component with given props", () => {
    render(<ConsumptionAnalysis data={mockData} />);

    expect(screen.getByText("Meal Consumption Analysis")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Overall good consumption")).toBeInTheDocument();
  });

  it("displays the correct percentage eaten in the progress bar", () => {
    render(<ConsumptionAnalysis data={mockData} />);

    expect(screen.getByText("50% eaten")).toBeInTheDocument();
    expect(screen.getByText("75% eaten")).toBeInTheDocument();
  });

  it("conditionally renders notes when provided", () => {
    render(<ConsumptionAnalysis data={mockData} />);

    expect(screen.getByText("Fresh and juicy")).toBeInTheDocument();
    expect(screen.queryByText("No notes")).not.toBeInTheDocument();
  });

  it("does not render notes when not provided", () => {
    const dataWithoutNotes = {
      ...mockData,
      foods: [{ name: "Banana", percentageEaten: 75 }],
    };
    render(<ConsumptionAnalysis data={dataWithoutNotes} />);
    expect(screen.queryByText("Fresh and juicy")).not.toBeInTheDocument();
  });
});
