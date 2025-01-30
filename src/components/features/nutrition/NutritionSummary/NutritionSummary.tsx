// components/NutritionSummary.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MealType } from "@/types/food";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { ArrowUpDown } from "lucide-react";

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define the props interface for the NutritionSummary component
interface NutritionSummaryProps {
  mealNutrition: NutritionData;
  dailyNutrition: NutritionData;
  selectedMeal: MealType | null;
}
export function NutritionSummary({
  mealNutrition,
  dailyNutrition,
  selectedMeal,
}: NutritionSummaryProps) {
  const [showDailyTotal, setShowDailyTotal] = useState(false);
  const currentNutrition = showDailyTotal ? dailyNutrition : mealNutrition;

  const getProgressBarWidth = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    return `${Math.min(percentage, 100)}%`;
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return "bg-red-500";
    if (percentage > 90 && percentage <= 95) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getNutrientColor = (current: number, min: number, max: number) => {
    if (current < min) return "text-yellow-600";
    if (current > max) return "text-red-600";
    return "text-green-600";
  };

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
                    // @ts-expect-error Idk what to do
                    selectedMeal?.charAt(0).toUpperCase() +
                    // @ts-expect-error Idk what to do
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
          {/* Calories */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Calories</span>
              <span className="font-medium">
                {Math.round(currentNutrition.calories || 0)} /{" "}
                {showDailyTotal
                  ? DAILY_GOALS.dailyTotals.calories
                  : // @ts-expect-error Idk what to do
                    DAILY_GOALS.mealCalories[selectedMeal]}{" "}
                cal
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(
                  currentNutrition.calories,
                  showDailyTotal
                    ? DAILY_GOALS.dailyTotals.calories
                    : // @ts-expect-error Idk what to do
                      DAILY_GOALS.mealCalories[selectedMeal]
                )} transition-all duration-300`}
                style={{
                  width: getProgressBarWidth(
                    currentNutrition.calories,
                    showDailyTotal
                      ? DAILY_GOALS.dailyTotals.calories
                      : // @ts-expect-error Idk what to do
                        DAILY_GOALS.mealCalories[selectedMeal]
                  ),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Protein */}
            <div
              className={`p-3 rounded-lg transition-colors ${
                showDailyTotal ? "bg-blue-50/50" : "bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium mb-1">Protein</div>
              <div
                className={`text-lg font-bold ${getNutrientColor(
                  currentNutrition.protein,
                  DAILY_GOALS.dailyTotals.protein.min,
                  DAILY_GOALS.dailyTotals.protein.max
                )}`}
              >
                {(currentNutrition.protein || 0).toFixed(1)}g
              </div>
              {showDailyTotal && (
                <div className="text-xs text-gray-500">
                  Target: {DAILY_GOALS.dailyTotals.protein.min}-
                  {DAILY_GOALS.dailyTotals.protein.max}g
                </div>
              )}
            </div>

            {/* Carbs */}
            <div
              className={`p-3 rounded-lg transition-colors ${
                showDailyTotal ? "bg-blue-50/50" : "bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium mb-1">Carbs</div>
              <div className="text-lg font-bold">
                {(currentNutrition.carbs || 0).toFixed(1)}g
              </div>
            </div>

            {/* Fat */}
            <div
              className={`p-3 rounded-lg transition-colors ${
                showDailyTotal ? "bg-blue-50/50" : "bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium mb-1">Fat</div>
              <div
                className={`text-lg font-bold ${getNutrientColor(
                  currentNutrition.fat,
                  DAILY_GOALS.dailyTotals.fat.min,
                  DAILY_GOALS.dailyTotals.fat.max
                )}`}
              >
                {(currentNutrition.fat || 0).toFixed(1)}g
              </div>
              {showDailyTotal && (
                <div className="text-xs text-gray-500">
                  Target: {DAILY_GOALS.dailyTotals.fat.min}-
                  {DAILY_GOALS.dailyTotals.fat.max}g
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
