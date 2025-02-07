import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { MealType } from "@/types/meals";
import { MealSelection, SelectedFood, Food } from "@/types/food";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormatOptions {
  includeIngredients: boolean;
  includeNutrition: boolean;
}

interface MealAnalysisProps {
  selectedMeal: MealType;
  mealSelections: MealSelection;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  recommendations: string[];
  warnings: string[];
  balanceScore: number;
  nutritionalGoalsAnalysis: {
    meetsCalorieGoal: boolean;
    meetsProteinGoal: boolean;
    meetsFatGoal: boolean;
  };
}

const formatFoodDetails = (
  food: SelectedFood | null | Food[],
  options: FormatOptions = {
    includeIngredients: true,
    includeNutrition: true,
  }
): string => {
  if (!food) return "";

  // Handle array of foods (for condiments)
  if (Array.isArray(food)) {
    return food.map((item) => formatFoodDetails(item, options)).join(", ");
  }

  const basicInfo = `${food.name} (${food.servings} serving${
    food.servings > 1 ? "s" : ""
  })`;

  const nutritionInfo = options.includeNutrition
    ? `, ${food.adjustedCalories || food.calories} cal, ${
        food.adjustedProtein || food.protein
      }g protein, ${food.adjustedCarbs || food.carbs}g carbs, ${
        food.adjustedFat || food.fat
      }g fat`
    : "";

  const ingredientsInfo =
    options.includeIngredients && food.ingredients
      ? ` - Ingredients: ${food.ingredients}`
      : "";

  return basicInfo + nutritionInfo + ingredientsInfo;
};

export function MealAnalysis({
  selectedMeal,
  mealSelections,
  onAnalysisComplete,
  isOpen,
  onClose,
}: MealAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<{
    message: string;
    details?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);

  // Cleanup function for AbortController
  useEffect(() => {
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [controller]);

  const analyzeMeal = async () => {
    console.log("analyzeMeal called", { selectedMeal, mealSelections });
    // Reset error state
    setError(null);

    // Abort any existing request
    if (controller) {
      controller.abort();
    }

    // Create new AbortController for this request
    const newController = new AbortController();
    setController(newController);
    setIsLoading(true);

    try {
      const mealDescription = Object.entries(mealSelections)
        .map(([category, food]) => {
          if (!food || (Array.isArray(food) && food.length === 0)) return null;
          return `${category}: ${formatFoodDetails(food, {
            includeIngredients: true,
            includeNutrition: true,
          })}`;
        })
        .filter(Boolean)
        .join("\n");

      console.log("Generated meal description:", mealDescription);

      const prompt = `Analyze this ${selectedMeal} meal selection and its nutritional composition. Keep in mind that this is a single meal, not a full day's worth of nutrition, and will be eaten by a 5 year old girl. So remember that she will also be two other meals plus a snack:

Meal Contents:
${mealDescription}

Target Goals for ${selectedMeal}:
- Calories: ${DAILY_GOALS.mealCalories[selectedMeal]} calories
- Protein: ${(DAILY_GOALS.dailyTotals.protein.min / 3.5).toFixed(1)}-${(
        DAILY_GOALS.dailyTotals.protein.max / 3.5
      ).toFixed(1)}g
- Fat: ${(DAILY_GOALS.dailyTotals.fat.min / 3.5).toFixed(1)}-${(
        DAILY_GOALS.dailyTotals.fat.max / 3.5
      ).toFixed(1)}g

Please analyze the meal's nutritional balance and provide recommendations/suggestions.
balanceScore should be a number from 1-100, with 100 being the most balanced and healthiest.
Format your response as JSON with these exact keys:
{
  "nutrition": {"calories": number, "protein": number, "carbs": number, "fat": number},
  "recommendations": string[],
  "warnings": string[],
  "balanceScore": number,
  "nutritionalGoalsAnalysis": {
    "meetsCalorieGoal": boolean,
    "meetsProteinGoal": boolean,
    "meetsFatGoal": boolean
  }
}`;

      console.log("Making API request...");
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: newController.signal,
      });

      console.log("API response received:", response.status);
      const data = await response.json();
      console.log("API response data:", data);

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to analyze meal");
      }

      if (!data.output) {
        throw new Error("No analysis available");
      }

      console.log("Parsing analysis response...");
      const analysisText = data.output;
      const parsedAnalysis = JSON.parse(analysisText);
      console.log("Parsed analysis:", parsedAnalysis);
      setAnalysis(parsedAnalysis);
      onAnalysisComplete?.(parsedAnalysis);
    } catch (error) {
      console.error("Error in analyzeMeal:", error);
      if ((error as Error).name === "AbortError") {
        console.log("Request cancelled");
      } else {
        console.error("Error analyzing meal:", error);
        setError({
          message: "Failed to analyze meal",
          details: error instanceof Error ? error.message : undefined,
        });
        setAnalysis(null);
      }
    } finally {
      setIsLoading(false);
      setController(null);
    }
  };

  useEffect(() => {
    console.log("MealAnalysis isOpen changed:", isOpen);
    if (isOpen) {
      analyzeMeal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Helper function to render goal status

  const renderGoalStatus = ({ met }: { met: boolean }) => {
    return met ? (
      <Check className="text-green-500 h-5 w-5" />
    ) : (
      <X className="text-red-500 h-5 w-5" />
    );
  };

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const nutrition =
    analysis && typeof analysis !== "string" ? analysis.nutrition : null;
  const recommendations =
    analysis && typeof analysis !== "string" ? analysis.recommendations : [];
  const warnings =
    analysis && typeof analysis !== "string" ? analysis.warnings : [];
  const balanceScore =
    analysis && typeof analysis !== "string" ? analysis.balanceScore : 0;
  const nutritionalGoalsAnalysis =
    analysis && typeof analysis !== "string"
      ? analysis.nutritionalGoalsAnalysis
      : null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (controller) {
            controller.abort();
          }
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Meal Analysis</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4">
          {isLoading && (
            <div
              role="status"
              className="flex justify-center items-center min-h-[200px]"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">{error.message}</div>
                {error.details && (
                  <div className="text-sm mt-1">{error.details}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {analysis && typeof analysis !== "string" && (
            <ScrollArea className="h-[60vh] pr-4">
              {/* Analysis Content */}
              <div className="space-y-4">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center justify-between">
                      <span>Nutritional Analysis</span>
                      <div
                        className={`text-2xl font-bold ${getScoreColor(
                          balanceScore
                        )}`}
                      >
                        Score: {balanceScore}
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
                      {/* Nutrition Breakdown */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Nutrition Breakdown
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">
                              Calories
                            </div>
                            <div className="text-xl font-bold">
                              {nutrition?.calories}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Protein</div>
                            <div className="text-xl font-bold">
                              {nutrition?.protein}g
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Carbs</div>
                            <div className="text-xl font-bold">
                              {nutrition?.carbs}g
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Fat</div>
                            <div className="text-xl font-bold">
                              {nutrition?.fat}g
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Goals Analysis */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Nutritional Goals
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Calorie Goal</span>
                            {renderGoalStatus({
                              met:
                                nutritionalGoalsAnalysis?.meetsCalorieGoal ??
                                false,
                            })}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Protein Goal</span>
                            {renderGoalStatus({
                              met:
                                nutritionalGoalsAnalysis?.meetsProteinGoal ??
                                false,
                            })}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Fat Goal</span>
                            {renderGoalStatus({
                              met:
                                nutritionalGoalsAnalysis?.meetsFatGoal ?? false,
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Warnings */}
                      {warnings && warnings.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Important Notes
                          </h3>
                          {warnings.map((warning, index) => (
                            <Alert key={index} className="mb-3">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="ml-2">
                                {warning}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}

                      {/* Recommendations */}
                      {recommendations && recommendations.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Recommendations
                          </h3>
                          <div className="space-y-3">
                            {recommendations.map((recommendation, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg"
                              >
                                {recommendation}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
