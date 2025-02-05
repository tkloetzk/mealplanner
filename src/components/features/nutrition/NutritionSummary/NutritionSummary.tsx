// src/components/features/nutrition/NutritionSummary/NutritionSummary.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MealType } from "@/types/meals";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { ArrowUpDown } from "lucide-react";
import { useMealStore } from "@/store/useMealStore";

interface NutritionSummaryProps {
  selectedMeal: MealType | null;
}

export function NutritionSummary({ selectedMeal }: NutritionSummaryProps) {
  const [showDailyTotal, setShowDailyTotal] = useState(false);
  const calculateMealNutrition = useMealStore(
    (state) => state.calculateMealNutrition
  );
  const calculateDailyTotals = useMealStore(
    (state) => state.calculateDailyTotals
  );

  console.log("selectedMeal", selectedMeal);
  console.log(
    "calculateMealNutrition(selectedMeal)",
    calculateMealNutrition(selectedMeal)
  );
  // Get current nutrition values
  const currentNutrition = showDailyTotal
    ? calculateDailyTotals()
    : selectedMeal
    ? calculateMealNutrition(selectedMeal)
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const getProgressBarWidth = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    return `${Math.min(percentage, 100)}%`;
  };

  const getProgressColor = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return "bg-red-500";
    if (percentage > 90 && percentage <= 95) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getNutrientColor = (
    current: number,
    min: number,
    max: number
  ): string => {
    if (current < min) return "text-yellow-600";
    if (current > max) return "text-red-600";
    return "text-green-600";
  };

  const renderNutrientCard = (
    label: string,
    value: number,
    min?: number,
    max?: number
  ) => (
    <div
      className={`p-3 rounded-lg transition-colors ${
        showDailyTotal ? "bg-blue-50/50" : "bg-gray-50"
      }`}
      data-testid={`nutrient-${label.toLowerCase()}`}
    >
      <div className="text-sm font-medium mb-1">{label}</div>
      <div
        className={`text-lg font-bold ${
          min && max ? getNutrientColor(value, min, max) : ""
        }`}
      >
        {typeof value === "number" ? value.toFixed(1) : "0.0"}g
      </div>
      {showDailyTotal && min && max && (
        <div className="text-xs text-gray-500">
          Target: {min}-{max}g
        </div>
      )}
    </div>
  );

  const targetCalories = showDailyTotal
    ? DAILY_GOALS.dailyTotals.calories
    : selectedMeal
    ? DAILY_GOALS.mealCalories[selectedMeal] || 0
    : 0;

  const nutritionStatus = selectedMeal
    ? {
        meetsCalorieGoal:
          currentNutrition.calories >= targetCalories * 0.9 &&
          currentNutrition.calories <= targetCalories * 1.1,
        meetsProteinGoal:
          currentNutrition.protein >= DAILY_GOALS.dailyTotals.protein.min &&
          currentNutrition.protein <= DAILY_GOALS.dailyTotals.protein.max,
        meetsFatGoal:
          currentNutrition.fat >= DAILY_GOALS.dailyTotals.fat.min &&
          currentNutrition.fat <= DAILY_GOALS.dailyTotals.fat.max,
      }
    : null;

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-md mb-6 ${
        showDailyTotal ? "bg-blue-50/50" : "bg-white"
      }`}
      onClick={() => setShowDailyTotal(!showDailyTotal)}
      data-testid="nutrition-summary"
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Nutrition Summary</h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${
                  showDailyTotal
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }
              `}
            >
              {showDailyTotal
                ? "Daily Total"
                : `${
                    selectedMeal
                      ? selectedMeal.charAt(0).toUpperCase() +
                        selectedMeal.slice(1)
                      : "Unknown"
                  } Total`}
            </div>
            <ArrowUpDown
              className={`h-4 w-4 ${
                showDailyTotal ? "text-blue-500" : "text-gray-500"
              }`}
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Calories Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Calories</span>
              <span className="font-medium" data-testid="calories-value">
                {Math.round(currentNutrition.calories)} / {targetCalories} cal
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(
                  currentNutrition.calories,
                  targetCalories
                )} transition-all duration-300`}
                style={{
                  width: getProgressBarWidth(
                    currentNutrition.calories,
                    targetCalories
                  ),
                }}
                data-testid="calories-progress"
              />
            </div>
          </div>

          {/* Macronutrient Cards */}
          <div className="grid grid-cols-3 gap-4">
            {renderNutrientCard(
              "Protein",
              currentNutrition.protein,
              DAILY_GOALS.dailyTotals.protein.min,
              DAILY_GOALS.dailyTotals.protein.max
            )}

            {renderNutrientCard("Carbs", currentNutrition.carbs)}

            {renderNutrientCard(
              "Fat",
              currentNutrition.fat,
              DAILY_GOALS.dailyTotals.fat.min,
              DAILY_GOALS.dailyTotals.fat.max
            )}
          </div>

          {/* Status Indicators */}
          {nutritionStatus && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {Object.entries(nutritionStatus).map(([key, met]) => (
                  <div
                    key={key}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      met
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
