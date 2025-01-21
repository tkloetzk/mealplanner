// src/components/features/food/FoodAnalysis/components/FoodImageAnalysis/__tests__/FoodAnalysisDisplay.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { FoodAnalysisDisplay } from "../FoodAnalysisDisplay";

describe("FoodAnalysisDisplay Component", () => {
  const mockAnalysis = {
    foods: [
      {
        name: "Apple",
        description: "A fresh, red apple",
        portionSize: "1 medium apple (182g)",
        visualCharacteristics: "Bright red, smooth skin, round shape",
        nutritionalAnalysis: "Low in calories, high in fiber",
        suggestions: "Eat with the skin for maximum nutritional benefits",
        concerns: "May cause allergic reactions in some individuals",
      },
    ],
    summary: "A nutritious fruit with various health benefits",
  };

  it("renders the summary", () => {
    render(<FoodAnalysisDisplay analysis={mockAnalysis} />);

    const summaryElement = screen.getByText(
      "A nutritious fruit with various health benefits"
    );
    expect(summaryElement).toBeInTheDocument();
  });

  it("renders food details correctly", () => {
    render(<FoodAnalysisDisplay analysis={mockAnalysis} />);

    // Check food name
    expect(screen.getByText("Apple")).toBeInTheDocument();

    // Check food description
    expect(screen.getByText("A fresh, red apple")).toBeInTheDocument();
  });

  it("renders all info sections", () => {
    render(<FoodAnalysisDisplay analysis={mockAnalysis} />);

    // Check section titles
    expect(screen.getByText(/PORTION SIZE/i)).toBeInTheDocument();
    expect(screen.getByText(/VISUAL CHARACTERISTICS/i)).toBeInTheDocument();
    expect(screen.getByText(/NUTRITIONAL ANALYSIS/i)).toBeInTheDocument();
    expect(screen.getByText(/SUGGESTIONS/i)).toBeInTheDocument();
    expect(screen.getByText(/HEALTH CONCERNS/i)).toBeInTheDocument();
  });

  it("displays correct content for each info section", () => {
    render(<FoodAnalysisDisplay analysis={mockAnalysis} />);

    // Check section contents
    expect(screen.getByText("1 medium apple (182g)")).toBeInTheDocument();
    expect(
      screen.getByText("Bright red, smooth skin, round shape")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Low in calories, high in fiber")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Eat with the skin for maximum nutritional benefits")
    ).toBeInTheDocument();
    expect(
      screen.getByText("May cause allergic reactions in some individuals")
    ).toBeInTheDocument();
  });

  it("handles multiple food items", () => {
    const multiItemAnalysis = {
      foods: [
        {
          name: "Apple",
          description: "A fresh, red apple",
          portionSize: "1 medium apple (182g)",
          visualCharacteristics: "Bright red, smooth skin, round shape",
          nutritionalAnalysis: "Low in calories, high in fiber",
          suggestions: "Eat with the skin for maximum nutritional benefits",
          concerns: "May cause allergic reactions in some individuals",
        },
        {
          name: "Banana",
          description: "A ripe yellow banana",
          portionSize: "1 medium banana (118g)",
          visualCharacteristics: "Yellow, curved shape",
          nutritionalAnalysis: "Rich in potassium and vitamins",
          suggestions: "Great for smoothies or as a quick snack",
          concerns: "High in sugar, consume in moderation",
        },
      ],
      summary: "A combination of nutritious fruits",
    };

    render(<FoodAnalysisDisplay analysis={multiItemAnalysis} />);

    // Check both food items are rendered
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("handles empty analysis", () => {
    const emptyAnalysis = {
      foods: [],
      summary: "",
    };

    const { container } = render(
      <FoodAnalysisDisplay analysis={emptyAnalysis} />
    );

    // Ensure no errors are thrown and the component renders without content
    expect(container.firstChild).toBeTruthy();
  });

  it("applies correct styling to warning section", () => {
    render(<FoodAnalysisDisplay analysis={mockAnalysis} />);

    const healthConcernsSection = screen.getByText(
      "May cause allergic reactions in some individuals"
    );
    expect(healthConcernsSection).toHaveClass("text-amber-600");
  });

  it("renders section titles with correct styling", () => {
    render(<FoodAnalysisDisplay analysis={mockAnalysis} />);

    const sectionTitles = screen.getAllByText(
      /PORTION SIZE|VISUAL CHARACTERISTICS|NUTRITIONAL ANALYSIS|SUGGESTIONS|HEALTH CONCERNS/i
    );

    sectionTitles.forEach((title) => {
      expect(title).toHaveClass("text-xs");
      expect(title).toHaveClass("font-medium");
      expect(title).toHaveClass("uppercase");
      expect(title).toHaveClass("tracking-wider");
      expect(title).toHaveClass("text-muted-foreground");
    });
  });
});
