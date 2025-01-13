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

const getCalorieProgressColor = (current: number, target: number) => {
  const percentage = (current / target) * 100;
  return percentage > 100
    ? "bg-red-500"
    : percentage > 90
    ? "bg-yellow-500"
    : "bg-green-500";
};

const getRangeProgressColor = (current: number, min: number, max: number) => {
  return current < min
    ? "bg-yellow-500"
    : current > max
    ? "bg-red-500"
    : "bg-emerald-500";
};

const getProgressValue = (
  metric: MetricType,
  currentCalories: number,
  currentProtein: number,
  currentFat: number,
  selectedMeal?: string
) => {
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

const getProgressBarColor = (
  metric: MetricType,
  currentCalories: number,
  currentProtein: number,
  currentFat: number,
  selectedMeal?: string
) => {
  if (metric === "calories") {
    const target = selectedMeal
      ? DAILY_GOALS.mealCalories[
          selectedMeal as keyof typeof DAILY_GOALS.mealCalories
        ]
      : DAILY_GOALS.dailyTotals.calories;

    return currentCalories > target
      ? "[&>div]:bg-red-500"
      : currentCalories > target * 0.9
      ? "[&>div]:bg-yellow-500"
      : "[&>div]:bg-green-500";
  }

  if (metric === "protein") {
    const { min, max } = DAILY_GOALS.dailyTotals.protein;
    return currentProtein >= min && currentProtein <= max
      ? "[&>div]:bg-green-500"
      : "[&>div]:bg-yellow-500";
  }

  if (metric === "fat") {
    const { min, max } = DAILY_GOALS.dailyTotals.fat;
    return currentFat >= min && currentFat <= max
      ? "[&>div]:bg-green-500"
      : "[&>div]:bg-yellow-500";
  }

  return "[&>div]:bg-gray-500";
};

const getMetricData = (
  metric: MetricType,
  currentCalories: number,
  currentProtein: number,
  currentFat: number,
  selectedMeal?: string
) => {
  switch (metric) {
    case "calories":
      const targetCalories = selectedMeal
        ? DAILY_GOALS.mealCalories[
            selectedMeal as keyof typeof DAILY_GOALS.mealCalories
          ]
        : DAILY_GOALS.dailyTotals.calories;
      return {
        current: currentCalories,
        target: targetCalories,
        unit: "cal",
        color: getCalorieProgressColor(currentCalories, targetCalories),
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

export function CompactNutritionProgress({
  currentCalories,
  currentProtein,
  currentFat,
  selectedMeal,
}: CompactNutritionProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricType>("calories");

  const handleMetricClick = () => {
    const metrics: MetricType[] = ["calories", "protein", "fat"];
    const currentIndex = metrics.indexOf(activeMetric);
    const nextIndex = (currentIndex + 1) % metrics.length;
    setActiveMetric(metrics[nextIndex]);
  };

  const currentMetricData = getMetricData(
    activeMetric,
    currentCalories,
    currentProtein,
    currentFat,
    selectedMeal
  );

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
            value={getProgressValue(
              activeMetric,
              currentCalories,
              currentProtein,
              currentFat,
              selectedMeal
            )}
            className={`h-2 [&>div]:transition-colors ${getProgressBarColor(
              activeMetric,
              currentCalories,
              currentProtein,
              currentFat,
              selectedMeal
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
            {(["calories", "protein", "fat"] as MetricType[]).map((metric) => {
              const metricData = getMetricData(
                metric,
                currentCalories,
                currentProtein,
                currentFat,
                selectedMeal
              );
              return (
                <div key={metric}>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <span>
                      {getMetricLabel(metric)}: {metricData.current}/
                      {metricData.target}
                      {metricData.unit}
                    </span>
                  </div>
                  <Progress
                    value={(metricData.current / metricData.target) * 100}
                    className={`h-1.5 ${metricData.color}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
