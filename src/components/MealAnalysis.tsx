import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { MealType, MealSelection } from "@/types/food";

interface MealAnalysisProps {
  selectedMeal: MealType;
  mealSelections: MealSelection;
  onAnalysisComplete?: (analysis: string) => void;
}

export function MealAnalysis({
  selectedMeal,
  mealSelections,
  onAnalysisComplete,
}: MealAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const formatMealDescription = (): string => {
    return Object.entries(mealSelections)
      .filter(([_, food]) => food !== null)
      .map(([category, food]) => `${category}: ${food?.name}`)
      .join(", ");
  };

  const analyzeMeal = async () => {
    setIsLoading(true);
    try {
      const mealDescription = formatMealDescription();
      const prompt = `As a nutritionist, analyze this ${selectedMeal} meal for a child:
        ${mealDescription}
        
        Please provide:
        1. Overall nutritional assessment (balanced meal, missing food groups, etc.)
        2. Health benefits of the chosen foods
        3. Age-appropriate suggestions for improvements or substitutions if needed
        4. Kid-friendly tips for enjoying this meal
        5. Any specific nutritional recommendations based on the meal type (${selectedMeal})`;

      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze meal");
      }

      const data = await response.json();
      const analysisText = data.output;

      setAnalysis(analysisText);
      onAnalysisComplete?.(analysisText);
    } catch (error) {
      console.error("Error analyzing meal:", error);
      setAnalysis(
        "Sorry, I couldn't analyze your meal right now. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasFoodsSelected = Object.values(mealSelections).some(
    (food) => food !== null
  );

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">AI Meal Analysis</h3>
        <Button
          onClick={analyzeMeal}
          disabled={isLoading || !hasFoodsSelected}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          {isLoading ? "Analyzing..." : "Analyze Meal"}
        </Button>
      </div>

      {analysis && (
        <div className="prose prose-sm max-w-none mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="whitespace-pre-wrap">{analysis}</div>
        </div>
      )}
    </Card>
  );
}
