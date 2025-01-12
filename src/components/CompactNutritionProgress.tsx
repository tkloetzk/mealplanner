// components/CompactNutritionProgress.tsx
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react"; // using Lucide icons
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

  const getCalorieProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 100) return "bg-red-500";
    if (percentage > 90) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRangeProgressColor = (current: number, min: number, max: number) => {
    if (current < min) return "bg-yellow-500";
    if (current > max) return "bg-red-500";
    if (current >= min && current <= max) return "bg-emerald-500";
    return "bg-green-500";
  };

  const getProgressValue = (metric: MetricType) => {
    switch (metric) {
      case "calories": {
        const target = selectedMeal
          ? DAILY_GOALS.mealCalories[
              selectedMeal as keyof typeof DAILY_GOALS.mealCalories
            ]
          : DAILY_GOALS.dailyTotals.calories;
        return (currentCalories / target) * 100;
      }
      case "protein": {
        const { min } = DAILY_GOALS.dailyTotals.protein;
        return Math.min((currentProtein / min) * 100, 100);
      }
      case "fat": {
        const { min } = DAILY_GOALS.dailyTotals.fat;
        return Math.min((currentFat / min) * 100, 100);
      }
    }
  };

  const getProgressBarColor = (metric: MetricType) => {
    if (metric === "calories") {
      const target = selectedMeal
        ? DAILY_GOALS.mealCalories[
            selectedMeal as keyof typeof DAILY_GOALS.mealCalories
          ]
        : DAILY_GOALS.dailyTotals.calories;

      if (currentCalories > target) return "[&>div]:bg-red-500";
      if (currentCalories > target * 0.9) return "[&>div]:bg-yellow-500";
      return "[&>div]:bg-green-500";
    }

    if (metric === "protein") {
      const { min, max } = DAILY_GOALS.dailyTotals.protein;
      if (currentProtein >= min && currentProtein <= max)
        return "[&>div]:bg-green-500";
      return "[&>div]:bg-yellow-500";
    }

    if (metric === "fat") {
      const { min, max } = DAILY_GOALS.dailyTotals.fat;
      if (currentFat >= min && currentFat <= max) return "[&>div]:bg-green-500";
      return "[&>div]:bg-yellow-500";
    }

    return "[&>div]:bg-gray-500"; // fallback
  };

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
          color: getCalorieProgressColor(
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
          target: DAILY_GOALS.dailyTotals.protein.min,
          unit: "g",
          color: getRangeProgressColor(
            currentProtein,
            DAILY_GOALS.dailyTotals.protein.min,
            DAILY_GOALS.dailyTotals.protein.max
          ),
        };
      case "fat":
        return {
          current: currentFat,
          target: DAILY_GOALS.dailyTotals.fat.min,
          unit: "g",
          color: getRangeProgressColor(
            currentFat,
            DAILY_GOALS.dailyTotals.fat.min,
            DAILY_GOALS.dailyTotals.fat.max
          ),
        };
    }
  };

  const handleMetricClick = () => {
    const metrics: MetricType[] = ["calories", "protein", "fat"];
    const currentIndex = metrics.indexOf(activeMetric);
    const nextIndex = (currentIndex + 1) % metrics.length;
    setActiveMetric(metrics[nextIndex]);
  };

  // Add label mapping
  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case "calories":
        return "Cal";
      case "protein":
        return "Protein";
      case "fat":
        return "Fat";
    }
  };

  const currentMetricData = getMetricData(activeMetric);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
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

        <div className="flex-1 mx-4 relative">
          <Progress
            value={getProgressValue(activeMetric)}
            className={`h-2 [&>div]:transition-colors ${getProgressBarColor(
              activeMetric
            )}`}
          />
        </div>

        <button
          onClick={handleMetricClick}
          className="flex items-center gap-2 text-sm font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-gray-100"
        >
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500">
              {getMetricLabel(activeMetric)}
            </span>
            <span>
              {currentMetricData.current}/{currentMetricData.target}{" "}
              {currentMetricData.unit}
            </span>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-2 space-y-2 border-t">
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <span>
                  Calories: {currentCalories}/{getMetricData("calories").target}
                </span>
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
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <span>
                  Protein: {currentProtein}/
                  {DAILY_GOALS.dailyTotals.protein.min}g
                </span>
              </div>
              <Progress
                value={getProgressValue("protein")}
                className={`h-1.5 ${getMetricData("protein").color}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <span>
                  Fat: {currentFat}/{DAILY_GOALS.dailyTotals.fat.min}g
                </span>
              </div>
              <Progress
                value={getProgressValue("fat")}
                className={`h-1.5 ${getMetricData("fat").color}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
