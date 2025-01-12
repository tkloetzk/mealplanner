// components/CompactNutritionProgress.tsx
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DAILY_GOALS } from "@/constants/meal-goals";

type MetricType = "calories" | "protein" | "fat";

interface CompactNutritionProgressProps {
  currentCalories: number;
  currentProtein: number;
  currentFat: number;
  selectedMeal?: string;
}

export function CompactNutritionProgress({
  currentCalories,
  currentProtein,
  currentFat,
  selectedMeal,
}: CompactNutritionProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricType>("calories");

  const getMetricData = (metric: MetricType) => {
    switch (metric) {
      case "calories":
        return {
          current: currentCalories,
          target: selectedMeal
            ? DAILY_GOALS.mealCalories[
                selectedMeal as keyof typeof DAILY_GOALS.mealCalories
              ]
            : DAILY_GOALS.dailyTotals.calories,
          unit: "cal",
          color: getProgressColor(
            currentCalories,
            selectedMeal
              ? DAILY_GOALS.mealCalories[
                  selectedMeal as keyof typeof DAILY_GOALS.mealCalories
                ]
              : DAILY_GOALS.dailyTotals.calories
          ),
        };
      case "protein":
        return {
          current: currentProtein,
          target: `${DAILY_GOALS.dailyTotals.protein.min}-${DAILY_GOALS.dailyTotals.protein.max}`,
          unit: "g",
          color: getProgressColor(
            currentProtein,
            DAILY_GOALS.dailyTotals.protein.max
          ),
        };
      case "fat":
        return {
          current: currentFat,
          target: `${DAILY_GOALS.dailyTotals.fat.min}-${DAILY_GOALS.dailyTotals.fat.max}`,
          unit: "g",
          color: getProgressColor(currentFat, DAILY_GOALS.dailyTotals.fat.max),
        };
    }
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage =
      (current /
        (typeof target === "string"
          ? parseInt(target.split("-")[1])
          : target)) *
      100;
    if (percentage > 100) return "bg-red-500";
    if (percentage > 90) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleMetricClick = () => {
    const metrics: MetricType[] = ["calories", "protein", "fat"];
    const currentIndex = metrics.indexOf(activeMetric);
    const nextIndex = (currentIndex + 1) % metrics.length;
    setActiveMetric(metrics[nextIndex]);
  };

  const currentMetricData = getMetricData(activeMetric);
  const progressValue =
    (currentMetricData.current /
      (typeof currentMetricData.target === "string"
        ? parseInt(currentMetricData.target.split("-")[1])
        : currentMetricData.target)) *
    100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      {/* Compact View (Always Visible) */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0 h-auto hover:bg-transparent"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 mx-4">
          <Progress
            value={progressValue}
            className={`h-2 ${currentMetricData.color}`}
          />
        </div>

        <button
          onClick={handleMetricClick}
          className="text-sm font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-gray-100"
        >
          {currentMetricData.current}/{currentMetricData.target}{" "}
          {currentMetricData.unit}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-2 space-y-2 border-t">
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <div className="text-xs text-gray-600 mb-1">
                Calories: {currentCalories}/{getMetricData("calories").target}
              </div>
              <Progress
                value={
                  (currentCalories /
                    (getMetricData("calories").target as number)) *
                  100
                }
                className={`h-1.5 ${getMetricData("calories").color}`}
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">
                Protein: {currentProtein}g/{DAILY_GOALS.dailyTotals.protein.max}
                g
              </div>
              <Progress
                value={
                  (currentProtein / DAILY_GOALS.dailyTotals.protein.max) * 100
                }
                className={`h-1.5 ${getMetricData("protein").color}`}
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">
                Fat: {currentFat}g/{DAILY_GOALS.dailyTotals.fat.max}g
              </div>
              <Progress
                value={(currentFat / DAILY_GOALS.dailyTotals.fat.max) * 100}
                className={`h-1.5 ${getMetricData("fat").color}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
