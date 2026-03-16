/**
 * Nutrition Summary Component
 *
 * Displays nutritional information for meals or daily totals.
 *
 * Features:
 * - Macronutrient tracking (calories, protein, carbs, fat)
 * - Sodium tracking with AAP/AHA recommended limits
 * - Added sugar tracking with AAP/AHA recommended limits
 * - Saturated fat tracking with AAP/AHA recommended limits
 * - Color-coded indicators based on AAP/AHA recommendations
 * - Tooltips with educational information about nutrition
 *
 * Sources:
 * - American Academy of Pediatrics (AAP) Nutrition Guidelines
 * - American Heart Association (AHA) Dietary Guidelines for Children
 * - Dietary Guidelines for Americans 2020-2025
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MealType } from "@/types/meals";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { ArrowUpDown, Info } from "lucide-react";
import { useMealNutrition, useDailyNutrition, useCurrentMealSelection } from "@/store/mealSelectors";
import { useAppSettingsStore } from "@/store/useAppSettingsStore";
import {
  getProgressBarWidth,
  getProgressColor,
  getNutrientColor,
  getSodiumColor,
  getSugarColor,
  getSaturatedFatColor,
} from "@/utils/nutritionUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NutritionSummaryProps {
  selectedMeal: MealType | null;
}

export function NutritionSummary({ selectedMeal }: NutritionSummaryProps) {
  const [showDailyTotal, setShowDailyTotal] = useState(false);
  const [macroDetail, setMacroDetail] = useState<'protein' | 'carbs' | 'fat' | null>(null);
  const mealNutrition = useMealNutrition(selectedMeal);
  const dailyNutrition = useDailyNutrition();
  const mealSelection = useCurrentMealSelection();
  const selectedKidId = useAppSettingsStore(state => state.kids[0]?.id); // Get first kid as default
  const getTargetsForKid = useAppSettingsStore(state => state.getTargetsForKid);

  // Get current nutrition values
  const currentNutrition = showDailyTotal ? dailyNutrition : mealNutrition;

  const getMacroBreakdown = (macro: 'protein' | 'carbs' | 'fat') => {
    if (!mealSelection) return [];
    const foods = [
      ...mealSelection.proteins,
      ...mealSelection.grains,
      ...mealSelection.fruits,
      ...mealSelection.vegetables,
      ...(mealSelection.milk ? [mealSelection.milk] : []),
      ...(mealSelection.ranch ? [mealSelection.ranch] : []),
      ...mealSelection.condiments,
      ...mealSelection.other,
    ];
    return foods
      .map(f => ({ name: f.name, value: Math.round(f[macro] * f.servings * 10) / 10 }))
      .filter(f => f.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const renderNutrientCard = (
    label: string,
    value: number,
    min?: number,
    max?: number,
    unit: string = "g",
    colorFunction?: (current: number, min: number, max: number) => string,
    tooltipContent?: string,
    onClickCard?: (e: React.MouseEvent) => void
  ) => (
    <div
      className={`p-3 rounded-lg transition-colors ${
        showDailyTotal ? "bg-blue-50/50" : "bg-gray-50"
      } ${onClickCard ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}
      data-testid={`nutrient-${label.toLowerCase()}`}
      onClick={onClickCard}
    >
      <div className="flex items-center gap-1 mb-1">
        <div className="text-sm font-medium">{label}</div>
        {tooltipContent && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div
        className={`text-lg font-bold ${
          min !== undefined && max !== undefined && colorFunction
            ? colorFunction(value, min, max)
            : min !== undefined && max !== undefined
              ? getNutrientColor(value, min, max)
              : ""
        }`}
      >
        {typeof value === "number" ? value.toFixed(1) : "0.0"}{unit}
      </div>
      {showDailyTotal && min !== undefined && max !== undefined && (
        <div className="text-xs text-gray-500">
          Target: {min}{unit}-{max}{unit}
        </div>
      )}
    </div>
  );

  const targetCalories = showDailyTotal
    ? DAILY_GOALS.dailyTotals.calories
    : selectedMeal
    ? DAILY_GOALS.mealCalories[selectedMeal] || 0
    : 0;

  // Get sodium target for the selected kid
  const sodiumTarget = selectedKidId ? getTargetsForKid(selectedKidId).sodium?.max : DAILY_GOALS.dailyTotals.sodiumMax;

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
    <TooltipProvider>
      <Card
        className={`cursor-pointer transition-all duration-300 hover:shadow-md mb-6 ${
          showDailyTotal ? "bg-blue-50/50" : "bg-white"
        }`}
        onClick={() => { setShowDailyTotal(!showDailyTotal); setMacroDetail(null); }}
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
                DAILY_GOALS.dailyTotals.protein.max,
                "g",
                undefined,
                "Essential for growth and muscle development",
                !showDailyTotal ? (e) => { e.stopPropagation(); setMacroDetail(macroDetail === 'protein' ? null : 'protein'); } : undefined
              )}

              {renderNutrientCard(
                "Carbs",
                currentNutrition.carbs,
                undefined,
                undefined,
                "g",
                undefined,
                "Primary source of energy for the body",
                !showDailyTotal ? (e) => { e.stopPropagation(); setMacroDetail(macroDetail === 'carbs' ? null : 'carbs'); } : undefined
              )}

              {renderNutrientCard(
                "Fat",
                currentNutrition.fat,
                DAILY_GOALS.dailyTotals.fat.min,
                DAILY_GOALS.dailyTotals.fat.max,
                "g",
                undefined,
                "Important for brain development and energy",
                !showDailyTotal ? (e) => { e.stopPropagation(); setMacroDetail(macroDetail === 'fat' ? null : 'fat'); } : undefined
              )}
            </div>

            {/* Macro breakdown panel */}
            {!showDailyTotal && macroDetail && (() => {
              const items = getMacroBreakdown(macroDetail);
              return (
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {macroDetail.charAt(0).toUpperCase() + macroDetail.slice(1)} breakdown
                  </div>
                  {items.length === 0 ? (
                    <div className="text-xs text-gray-400">No foods selected</div>
                  ) : (
                    <div className="space-y-1">
                      {items.map(({ name, value }) => (
                        <div key={name} className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate">{name}</span>
                          <span className="font-medium ml-2 shrink-0">{value}g</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sodium, Sugar, and Saturated Fat Cards - Only show for daily totals, not individual meals */}
            {showDailyTotal && (
              <div className="grid grid-cols-1 gap-4">
                {sodiumTarget && (
                  <div className="grid grid-cols-1">
                    {renderNutrientCard(
                      "Sodium",
                      currentNutrition.sodium || 0,
                      0,
                      sodiumTarget,
                      "mg",
                      getSodiumColor,
                      "Keep sodium intake below daily limit. High intake can affect blood pressure."
                    )}
                  </div>
                )}

                {/* Sugar and Saturated Fat - Get targets from app settings */}
                {currentNutrition.sugar !== undefined && currentNutrition.sugar >= 0 && (
                  <div className="grid grid-cols-1">
                    {renderNutrientCard(
                      "Sugar",
                      currentNutrition.sugar || 0,
                      0,
                      selectedKidId ? getTargetsForKid(selectedKidId).sugar?.max || 25 : 25, // Default max for added sugars per day (AAP/AHA recommendation for children)
                      "g",
                      getSugarColor,
                      "Limit added sugars. AAP/AHA recommends less than 25g per day for children."
                    )}
                  </div>
                )}

                {currentNutrition.saturatedFat !== undefined && currentNutrition.saturatedFat >= 0 && (
                  <div className="grid grid-cols-1">
                    {renderNutrientCard(
                      "Saturated Fat",
                      currentNutrition.saturatedFat || 0,
                      0,
                      selectedKidId ? getTargetsForKid(selectedKidId).saturatedFat?.max || 20 : 20, // Default max for saturated fat per day (AAP/AHA recommendation for children)
                      "g",
                      getSaturatedFatColor,
                      "Limit saturated fat. AAP/AHA recommends less than 20g per day for children."
                    )}
                  </div>
                )}

                {currentNutrition.fiber !== undefined && currentNutrition.fiber > 0 && (
                  <div className="grid grid-cols-1">
                    {renderNutrientCard(
                      "Fiber",
                      currentNutrition.fiber,
                      undefined,
                      undefined,
                      "g",
                      undefined,
                      "Dietary fiber supports digestion and heart health."
                    )}
                  </div>
                )}

                {currentNutrition.transFat !== undefined && currentNutrition.transFat > 0 && (
                  <div className="grid grid-cols-1">
                    {renderNutrientCard(
                      "Trans Fat",
                      currentNutrition.transFat,
                      undefined,
                      undefined,
                      "g",
                      undefined,
                      "Limit trans fat intake. It raises LDL cholesterol and lowers HDL cholesterol."
                    )}
                  </div>
                )}

                {currentNutrition.cholesterol !== undefined && currentNutrition.cholesterol > 0 && (
                  <div className="grid grid-cols-1">
                    {renderNutrientCard(
                      "Cholesterol",
                      currentNutrition.cholesterol,
                      undefined,
                      undefined,
                      "mg",
                      undefined,
                      "Dietary cholesterol. Dietary Guidelines recommend limiting intake."
                    )}
                  </div>
                )}
              </div>
            )}

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
    </TooltipProvider>
  );
}
