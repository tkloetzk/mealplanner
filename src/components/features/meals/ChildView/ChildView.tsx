// src/components/features/meals/ChildView/ChildView.tsx

import {
  MealType,
  CategoryType,
  Food,
  MealPlan,
  DayType,
  FoodOptions,
} from "@/types/food";
import { CategoryFoodGrid } from "./CategoryFoodGrid";
import { MealSelector } from "../MealPlanner/components/MealSelector";
import { useMemo } from "react";

interface ChildViewProps {
  selectedMeal: MealType | null;
  foodOptions: FoodOptions;
  selections: MealPlan;
  selectedDay: DayType;
  onFoodSelect: (category: CategoryType, food: Food) => void;
  onMealSelect: (meal: MealType) => void;
}

export function ChildView({
  selectedMeal,
  foodOptions,
  selections,
  selectedDay,
  onFoodSelect,
  onMealSelect,
}: ChildViewProps) {
  // Show relevant condiments based on selected foods
  const availableCondiments = useMemo(() => {
    if (!selectedMeal || !selections[selectedDay]?.[selectedMeal]) return [];

    const currentSelections = selections[selectedDay][selectedMeal];
    const selectedFoods = Object.entries(currentSelections)
      .filter(([category, food]) => food !== null && category !== "condiments")
      .map(([, food]) => food);

    // Filter condiments based on recommendedUses of selected foods
    return (
      foodOptions.condiments?.filter((condiment) => {
        if (condiment.hiddenFromChild) return false;

        if (selectedFoods.length === 0) {
          return condiment.recommendedUses?.includes("any");
        }

        return selectedFoods.some((food) =>
          condiment.recommendedUses?.includes(food?.category)
        );
      }) || []
    );
  }, [selectedMeal, selections, selectedDay, foodOptions.condiments]);

  // Initial meal selection view
  if (!selectedMeal) {
    return <MealSelector onMealSelect={onMealSelect} />;
  }

  // Food selection view
  return (
    <div className="p-4" data-testid="child-view">
      <h2 className="text-2xl font-bold text-center mb-8 capitalize">
        {selectedMeal}
      </h2>

      <div className="space-y-10">
        {/* Main food categories */}
        {(Object.entries(foodOptions) as [CategoryType, Food[]][])
          .filter(([category]) => category !== "condiments")
          .map(([category, foods]) => {
            // Filter out hidden foods and those not compatible with the meal
            const compatibleFoods = foods.filter(
              (food) =>
                !food.hiddenFromChild && food.meal?.includes(selectedMeal)
            );

            if (compatibleFoods.length === 0) return null;

            return (
              <CategoryFoodGrid
                key={category}
                category={category}
                foods={compatibleFoods}
                selectedDay={selectedDay}
                selectedMeal={selectedMeal}
                selections={selections}
                onFoodSelect={onFoodSelect}
              />
            );
          })}

        {/* Condiments section - only show if there are main foods selected */}
        {availableCondiments.length > 0 && (
          <div className="pt-6 border-t border-gray-200">
            <CategoryFoodGrid
              key="condiments"
              category="condiments"
              foods={availableCondiments}
              selectedDay={selectedDay}
              selectedMeal={selectedMeal}
              selections={selections}
              onFoodSelect={onFoodSelect}
              isCondimentGrid={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
