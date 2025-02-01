// src/components/features/nutrition/NutritionSummary/components/CompactNutritionProgress/CompactNutritionProgress.tsx
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { MealType } from "@/types/food";
import { useNutrition } from "./hooks/useNutrition";

type MetricType = "calories" | "protein" | "fat";

interface CompactNutritionProgressProps {
  currentCalories: number;
  currentProtein: number;
  currentFat: number;
  selectedMeal?: MealType;
}

const metricLabels: Record<MetricType, string> = {
  calories: "Cal",
  protein: "Protein",
  fat: "Fat",
};

export const CompactNutritionProgress = ({
  currentCalories,
  currentProtein,
  currentFat,
  selectedMeal,
}: CompactNutritionProgressProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricType>("calories");

  const { getProgressBarWidth, getProgressColor, getNutrientColor } =
    useNutrition(
      selectedMeal
        ? {
            calories: currentCalories,
            protein: currentProtein,
            fat: currentFat,
            carbs: 0,
          }
        : null,
      selectedMeal || null
    );

  const getMetricData = (metric: MetricType) => {
    switch (metric) {
      case "calories":
        const targetCalories = selectedMeal
          ? DAILY_GOALS.mealCalories[selectedMeal]
          : DAILY_GOALS.dailyTotals.calories;
        return {
          current: currentCalories,
          target: targetCalories,
          progressWidth: getProgressBarWidth(currentCalories, targetCalories),
          progressColor: getProgressColor(currentCalories, targetCalories),
          unit: "cal",
        };
      case "protein":
        const { min: proteinMin, max: proteinMax } =
          DAILY_GOALS.dailyTotals.protein;
        return {
          current: currentProtein,
          target: proteinMin,
          progressWidth: getProgressBarWidth(currentProtein, proteinMin),
          progressColor: getNutrientColor(
            currentProtein,
            proteinMin,
            proteinMax
          ),
          unit: "g",
        };
      case "fat":
        const { min: fatMin, max: fatMax } = DAILY_GOALS.dailyTotals.fat;
        return {
          current: currentFat,
          target: fatMin,
          progressWidth: getProgressBarWidth(currentFat, fatMin),
          progressColor: getNutrientColor(currentFat, fatMin, fatMax),
          unit: "g",
        };
    }
  };

  const metricData = useMemo(() => {
    return getMetricData(activeMetric);
  }, [
    activeMetric,
    currentCalories,
    currentProtein,
    currentFat,
    selectedMeal,
    getProgressBarWidth,
    getProgressColor,
    getNutrientColor,
    getMetricData,
  ]);

  const handleMetricClick = () => {
    const metrics: MetricType[] = ["calories", "protein", "fat"];
    const currentIndex = metrics.indexOf(activeMetric);
    const nextIndex = (currentIndex + 1) % metrics.length;
    setActiveMetric(metrics[nextIndex]);
  };

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

        <div className="flex-1 mx-4">
          <Progress
            value={(metricData.current / metricData.target) * 100}
            className={`h-2 transition-colors [&>div]:${metricData.progressColor}`}
          />
        </div>

        <button
          onClick={handleMetricClick}
          className="flex items-center gap-2 text-sm font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-gray-100"
        >
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500">
              {metricLabels[activeMetric]}
            </span>
            <span>
              {metricData.current}/{metricData.target} {metricData.unit}
            </span>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-2 space-y-2 border-t">
          <div className="grid grid-cols-3 gap-4 pt-2">
            {(["calories", "protein", "fat"] as MetricType[]).map((metric) => {
              const data = getMetricData(metric);
              return (
                <div key={metric}>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <span>
                      {metricLabels[metric]}: {data.current}/{data.target}
                      {data.unit}
                    </span>
                  </div>
                  <Progress
                    value={(data.current / data.target) * 100}
                    className={`h-1.5 [&>div]:${data.progressColor}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
