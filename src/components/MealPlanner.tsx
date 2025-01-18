"use client";
// src/components/MealPlanner.tsx
import React, { MouseEvent, useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, MessageSquare, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Import custom hook
import { useMealPlanState } from "@/hooks/useMealPlanState";

// Import components
import { ServingSelector } from "./ServingSelector";
import { ViewToggle } from "./ViewToggle";
import { MilkToggle } from "./MilkToggle";
import { FoodEditor } from "./FoodEditor/FoodEditor";
import { CompactNutritionProgress } from "@/components/CompactNutritionProgress";
import { KidSelector } from "./KidSelector";
import { RanchToggle } from "./RanchToggle";
import { NutritionSummary } from "./NutritionSummary";
import FoodItem from "./FoodItem";

// Import types and constants
import {
  Food,
  MealType,
  DayType,
  CategoryType,
  // MealSelection,
} from "@/types/food";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { Kid } from "@/types/user";
import { ChildView } from "./ChildView";
import { DAYS_OF_WEEK, MEAL_TYPES } from "@/constants";
import { FoodImageAnalysis } from "./FoodImageAnalysis";
import { MealAnalysis } from "./MealAnalysis";
// The AnalysisDialog component handles the modal display of AI analysis results
interface AnalysisDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function AnalysisDialog({
  isOpen,
  onOpenChange,
  children,
}: AnalysisDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="max-w-3xl"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <div className="flex justify-between items-start mb-4">
          <AlertDialogHeader>
            <AlertDialogTitle>AI Analysis</AlertDialogTitle>
          </AlertDialogHeader>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MealPlanner() {
  // Kids configuration
  const [kids] = useState<Kid[]>([
    { id: "1", name: "Presley" },
    { id: "2", name: "Evy" },
  ]);

  // View state
  const [isChildView, setIsChildView] = useState(false);

  // AI analysis state
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);

  // Food options and context state
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    proteins: [],
    grains: [],
    fruits: [],
    vegetables: [],
    milk: [],
  });
  const [selectedFoodContext, setSelectedFoodContext] = useState<{
    category: CategoryType;
    food: Food;
    mode: "serving" | "edit";
    currentServings?: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Use custom hook for meal planning state management
  const {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,
    setSelectedKid,
    setSelectedDay,
    setSelectedMeal,
    setSelections,
    handleFoodSelect,
    calculateMealNutrition,
    handleServingAdjustment,
    calculateDailyTotals,
    handleMilkToggle,
    handleRanchToggle,
  } = useMealPlanState(kids);

  // Helper function to get ordered days starting from today
  const getOrderedDays = (): DayType[] => {
    const days: DayType[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const today = new Date().getDay();
    return [...days.slice(today), ...days.slice(0, today)];
  };

  // Serving adjustment handler
  const handleServingClick = (
    e: MouseEvent<HTMLDivElement>,
    category: CategoryType,
    food: Food
  ) => {
    e.stopPropagation();
    if (selectedDay && selectedMeal && selectedKid) {
      const currentFood =
        // @ts-expect-error TypeScript doesn't understand the dynamic keys here
        selections[selectedKid]?.[selectedDay]?.[selectedMeal]?.[category];
      setSelectedFoodContext({
        category,
        food,
        mode: "serving",
        currentServings: currentFood?.servings || 1,
      });
    }
  };

  const handleEditFood = (category: CategoryType, food: Food) => {
    setSelectedFoodContext({
      category,
      food,
      mode: "edit",
    });
  };

  // Save food handler
  const handleSaveFood = async (food: Food) => {
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });

      if (response.ok) {
        setFoodOptions((prev) => ({
          ...prev,
          [food.category]: [...prev[food.category], food],
        }));
        setSelectedFoodContext(null);
      }
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete food");
      }

      setFoodOptions((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((category) => {
          updated[category] = updated[category].filter(
            (food) => food.id !== foodId
          );
        });
        return updated;
      });
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  };

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const [foodsRes] = await Promise.all([fetch("/api/foods")]);
        if (!foodsRes.ok) throw new Error("Failed to fetch foods");
        const foods = await foodsRes.json();
        setFoodOptions(foods);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const includesMilk = useMemo(() => {
    if (!selectedKid || !selectedDay)
      return {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
      };

    // @ts-expect-error TypeScript doesn't understand the dynamic keys here
    return MEAL_TYPES.reduce((acc: Record<MealType, boolean>, mealType) => {
      acc[mealType] =
        // @ts-expect-error TypeScript doesn't understand the dynamic keys here
        !!selections[selectedKid]?.[selectedDay]?.[mealType]?.milk;
      return acc;
      // @ts-expect-error TypeScript doesn't understand the dynamic keys here
    }, {} as Record<MealType, boolean>);
  }, [selections, selectedKid, selectedDay]);

  const includesRanch = useMemo(() => {
    if (!selectedKid || !selectedDay)
      return {
        breakfast: { has: false, servings: 0 },
        lunch: { has: false, servings: 0 },
        dinner: { has: false, servings: 0 },
        snack: { has: false, servings: 0 },
      };

    return MEAL_TYPES.reduce(
      (acc: Record<MealType, { has: boolean; servings: number }>, mealType) => {
        const ranch = selections[selectedKid]?.[selectedDay]?.[mealType]?.ranch;
        acc[mealType] = {
          has: !!ranch,
          servings: ranch?.servings || 1,
        };
        return acc;
      },
      {} as Record<MealType, { has: boolean; servings: number }>
    );
  }, [selections, selectedKid, selectedDay]);

  // Loading state
  if (isLoading) {
    return (
      <div
        role="status"
        className="flex justify-center items-center min-h-screen"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="meal-planner">
      <h1 className="text-3xl font-bold">Meal Planner</h1>
      <div className="flex justify-between items-center mb-6">
        <ViewToggle isChildView={isChildView} onToggle={setIsChildView} />
      </div>

      <KidSelector
        kids={kids}
        selectedKid={selectedKid}
        onSelect={setSelectedKid}
      />

      {!selectedKid ? (
        <div className="text-center py-12 text-gray-500">
          Please select a kid to start planning meals
        </div>
      ) : isChildView ? (
        <ChildView
          selectedMeal={selectedMeal}
          foodOptions={foodOptions}
          selections={selections[selectedKid] ?? DEFAULT_MEAL_PLAN}
          selectedDay={selectedDay}
          onFoodSelect={handleFoodSelect}
          onMealSelect={setSelectedMeal}
        />
      ) : (
        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="planner">Daily Planner</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="planner">
            {/* Day Selection */}
            <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
              {getOrderedDays().map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day as DayType)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    selectedDay === day
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {day as string}
                </button>
              ))}
            </div>

            {/* Meal Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`p-4 rounded-lg text-lg capitalize ${
                    selectedMeal === meal
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>

            {selectedMeal && !isChildView && (
              <>
                {/* AI Analysis Buttons */}
                <div className="mb-4 flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowImageAnalysis(true)}
                  >
                    <Camera className="w-4 h-4" />
                    Analyze Plate Photo
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const currentMealSelections =
                        // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                        selections[selectedKid]?.[selectedDay]?.[selectedMeal];
                      if (currentMealSelections) {
                        setShowAiAnalysis(true);
                      }
                    }}
                    disabled={
                      // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                      !selections[selectedKid]?.[selectedDay]?.[selectedMeal]
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    Analyze Meal Plan
                  </Button>
                </div>

                {/* Nutrition Summary */}
                <NutritionSummary
                  mealNutrition={calculateMealNutrition(selectedMeal)}
                  dailyNutrition={calculateDailyTotals()}
                  selectedMeal={selectedMeal}
                />
                {selectedMeal && selectedMeal !== "snack" && (
                  <div className="mb-6" data-testid="milk-toggle">
                    <MilkToggle
                      isSelected={
                        selectedMeal ? includesMilk[selectedMeal] : false
                      }
                      onChange={(value) =>
                        handleMilkToggle(selectedMeal, value)
                      }
                    />
                  </div>
                )}
                {selectedMeal && (
                  <div className="mb-6">
                    <RanchToggle
                      isSelected={includesRanch[selectedMeal].has}
                      servings={includesRanch[selectedMeal].servings}
                      onChange={(value, servings) =>
                        handleRanchToggle(selectedMeal, value, servings)
                      }
                    />
                  </div>
                )}

                {/* Food Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-14">
                  {(
                    Object.entries(foodOptions) as [CategoryType, Food[]][]
                  ).map(([category, foods]) => {
                    const compatibleFoods = selectedMeal
                      ? foods.filter((food) =>
                          food.meal?.includes(selectedMeal)
                        )
                      : foods;

                    if (compatibleFoods.length === 0) return null;

                    return (
                      <Card key={category}>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold capitalize mb-3">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {compatibleFoods.map((food, index) => {
                              const selectedFoodInCategory =
                                selectedKid && selectedDay && selectedMeal
                                  ? // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                                    selections[selectedKid]?.[selectedDay]?.[
                                      selectedMeal
                                    ]?.[category]
                                  : null;
                              const isSelected =
                                selectedFoodInCategory?.name === food.name;

                              return (
                                <FoodItem
                                  key={index}
                                  index={index}
                                  food={food}
                                  category={category}
                                  isSelected={isSelected}
                                  selectedFoodInCategory={
                                    selectedFoodInCategory
                                  }
                                  onSelect={() =>
                                    handleFoodSelect(category, food)
                                  }
                                  onServingClick={(e) =>
                                    handleServingClick(e, category, food)
                                  }
                                  onEditFood={() =>
                                    handleEditFood(category, food)
                                  }
                                />
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <Card key={day} className="p-4">
                  <h3 className="text-lg font-semibold capitalize mb-3">
                    {day}
                  </h3>
                  {Object.entries(selections[day] ?? {}).map(([meal]) => {
                    const nutrition = calculateMealNutrition(meal as MealType);
                    if (nutrition.calories > 0) {
                      return (
                        <div key={meal} className="mb-4 p-2 bg-gray-50 rounded">
                          <div className="font-medium capitalize">{meal}</div>
                          <div className="text-sm text-gray-600">
                            {Math.round(nutrition.calories)} cal | P:{" "}
                            {Math.round(nutrition.protein)}g
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {selectedKid &&
                mealHistory[selectedKid] &&
                Array.isArray(mealHistory[selectedKid]) &&
                mealHistory[selectedKid].map((entry, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold capitalize">
                        {entry.meal as string} -{" "}
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedMeal && selectedDay && selectedKid) {
                            const newSelections = { ...selections };
                            if (!newSelections[selectedKid]) {
                              newSelections[selectedKid] = {};
                            }
                            // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                            if (!newSelections[selectedKid][selectedDay]) {
                              // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                              newSelections[selectedKid][selectedDay] = {};
                            }
                            // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                            newSelections[selectedKid][selectedDay][
                              selectedMeal
                            ] = {
                              ...entry.selections,
                            };
                            setSelections(newSelections);
                          }
                        }}
                      >
                        Use Again
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {Object.entries(entry.selections)
                        .filter(([, food]) => food)
                        .map(([category, food]) => (
                          <div key={category}>
                            {food?.name} (
                            {Math.round(food?.adjustedCalories || 0)} cal)
                          </div>
                        ))}
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* ServingSelector Modal */}
      {selectedFoodContext?.mode === "serving" && (
        <ServingSelector
          food={selectedFoodContext.food}
          currentServings={selectedFoodContext.currentServings}
          onConfirm={(adjustedFood) => {
            handleServingAdjustment(selectedFoodContext.category, adjustedFood);
            setSelectedFoodContext(null);
          }}
          onCancel={() => setSelectedFoodContext(null)}
        />
      )}

      {/* FoodEditor Modal */}
      {selectedFoodContext?.mode === "edit" && (
        <FoodEditor
          onSave={handleSaveFood}
          onCancel={() => setSelectedFoodContext(null)}
          onDelete={handleDeleteFood}
          initialFood={selectedFoodContext.food}
        />
      )}

      {/* AI Analysis Dialogs */}
      <AnalysisDialog isOpen={showAiAnalysis} onOpenChange={setShowAiAnalysis}>
        {selectedKid && selectedDay && selectedMeal && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Meal Plan Analysis</h2>
            <p className="text-sm text-gray-600">
              Analysis of your planned meal&apos;s nutritional content and
              balance.
            </p>
            <MealAnalysis
              selectedMeal={selectedMeal}
              mealSelections={
                // @ts-expect-error TypeScript doesn't understand the dynamic keys here
                selections[selectedKid][selectedDay][selectedMeal]
              }
              onAnalysisComplete={(analysis) => {
                // Here you could add functionality to store the analysis
                // in the meal history or display it in a different way
                console.log("Meal analysis completed:", analysis);
              }}
            />
          </div>
        )}
      </AnalysisDialog>

      {/* Food Image Analysis Dialog */}
      <AnalysisDialog
        isOpen={showImageAnalysis}
        onOpenChange={setShowImageAnalysis}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Plate Photo Analysis</h2>
          <p className="text-sm text-gray-600">
            Take a photo of a prepared meal to get nutritional insights and
            recommendations.
          </p>
          <FoodImageAnalysis
            onAnalysisComplete={(analysis) => {
              console.log("Image analysis completed:", analysis);
              setShowImageAnalysis(false);
            }}
          />
        </div>
      </AnalysisDialog>

      {/* Nutrition Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <CompactNutritionProgress
          currentCalories={
            selectedMeal
              ? calculateMealNutrition(selectedMeal).calories
              : calculateDailyTotals().calories
          }
          currentProtein={calculateDailyTotals().protein}
          currentFat={calculateDailyTotals().fat}
          selectedMeal={selectedMeal}
        />
      </div>
    </div>
  );
}
