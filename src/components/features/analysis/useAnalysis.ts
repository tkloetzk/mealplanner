// components/features/analysis/useAnalysis.ts
import { useState } from "react";
import { MealSelection } from "@/types/food";

interface AnalysisState {
  isAnalyzing: boolean;
  showMealAnalysis: boolean;
  showImageAnalysis: boolean;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    showMealAnalysis: false,
    showImageAnalysis: false,
    error: null,
  });

  const analyzeMeal = async (mealSelection: MealSelection) => {
    setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections: mealSelection }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        showMealAnalysis: true,
        isAnalyzing: false,
      }));
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Analysis failed",
        isAnalyzing: false,
      }));
    }
  };

  return {
    state,
    analyzeMeal,
    closeAnalysis: () =>
      setState((prev) => ({
        ...prev,
        showMealAnalysis: false,
        showImageAnalysis: false,
      })),
  };
}
