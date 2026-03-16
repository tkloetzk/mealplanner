import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { MealType } from "@/types/meals";
import { MealSelection } from "@/types/food";
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
import { useAppSettingsStore } from "@/store/useAppSettingsStore";

interface MealAnalysisProps {
  selectedMeal: MealType;
  mealSelections: MealSelection;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
  isOpen: boolean;
  onClose: () => void;
  kidId?: string;
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

export function MealAnalysis({
  selectedMeal,
  mealSelections,
  onAnalysisComplete,
  isOpen,
  onClose,
  kidId,
}: MealAnalysisProps) {
  const kids = useAppSettingsStore((state) => state.kids);
  const getTargetsForKid = useAppSettingsStore((state) => state.getTargetsForKid);
  const kid = kids.find((k) => k.id === kidId) ?? kids[0];
  const kidTargets = kid ? getTargetsForKid(kid.id) : null;
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
      const mealCalorieTarget = kidTargets?.mealCalories?.[selectedMeal] ?? DAILY_GOALS.mealCalories[selectedMeal];
      const proteinTarget = kidTargets?.protein ?? DAILY_GOALS.dailyTotals.protein;
      const fatTarget = kidTargets?.fat ?? DAILY_GOALS.dailyTotals.fat;

      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealSelections,
          mealType: selectedMeal,
          kidProfile: {
            name: kid?.name ?? "the child",
            age: kid?.age ?? 5,
            activityLevel: kid?.activityLevel ?? "moderate",
            restrictions: kid?.restrictions?.trim() || undefined,
          },
          targets: {
            mealCalories: mealCalorieTarget,
            proteinMin: proteinTarget.min / 3.5,
            proteinMax: proteinTarget.max / 3.5,
            fatMin: fatTarget.min / 3.5,
            fatMax: fatTarget.max / 3.5,
          },
        }),
        signal: newController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to analyze meal");
      }

      if (!data.output) {
        throw new Error("No analysis available");
      }

      const parsedAnalysis = data.output;
      setAnalysis(parsedAnalysis);
      onAnalysisComplete?.(parsedAnalysis);
    } catch (error) {
      console.error("Error in analyzeMeal:", error);
      if ((error as Error).name !== "AbortError") {
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

  const nutrition = analysis?.nutrition ?? null;
  const recommendations = analysis?.recommendations ?? [];
  const warnings = analysis?.warnings ?? [];
  const balanceScore = analysis?.balanceScore ?? 0;
  const nutritionalGoalsAnalysis = analysis?.nutritionalGoalsAnalysis ?? null;

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

          {analysis && (
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
