// src/components/features/nutrition/NutritionSummary/NutritionSummary.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MealType, MealSelection } from "@/types/food";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { ArrowUpDown } from "lucide-react";
import { useNutrition } from "./components/CompactNutritionProgress/hooks/useNutrition";

interface NutritionSummaryProps {
  mealSelections: MealSelection;
  dailySelections: MealSelection;
  selectedMeal: MealType | null;
}

export function NutritionSummary({
  mealSelections,
  dailySelections,
  selectedMeal,
}: NutritionSummaryProps) {
  const [showDailyTotal, setShowDailyTotal] = useState(false);

  // Use the hook for both meal and daily nutrition
  const {
    mealNutrition: currentNutrition,
    nutritionStatus,
    getProgressBarWidth,
    getProgressColor,
    getNutrientColor,
  } = useNutrition(
    showDailyTotal ? dailySelections : mealSelections,
    selectedMeal
  );

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
    ? DAILY_GOALS.mealCalories[selectedMeal]
    : 0;

  console.log(currentNutrition);
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-md mb-6 ${
        showDailyTotal ? "bg-blue-50/50" : "bg-white"
      }`}
      onClick={() => setShowDailyTotal(!showDailyTotal)}
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
                    selectedMeal?.charAt(0).toUpperCase() +
                    selectedMeal?.slice(1)
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
              <span className="font-medium">
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
