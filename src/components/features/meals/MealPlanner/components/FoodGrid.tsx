import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import { FoodItem } from "@/components/features/meals/shared/FoodItem";
import { AddMenu } from "@/components/features/meals/shared/AddMenu/AddMenu";
import { getValidCategory } from "@/utils/meal-categories";
import type { CategoryType, MealType } from "@/types/shared";
import type { Food } from "@/types/food";
import type { FoodContext } from "../hooks/useFoodManagement";
import type { MealSelection } from "@/types/meals";

interface FoodGridProps {
  foodOptions: Record<CategoryType, Food[]>;
  selectedMeal: MealType | null;
  selectedKid: string;
  selectedDay: string;
  currentMealSelection: MealSelection | null;
  onFoodSelect: (category: CategoryType, food: Food) => void;
  onServingClick: (category: CategoryType, food: Food) => void;
  onEditFood: (category: CategoryType, food: Food) => void;
  onToggleVisibility: (food: Food) => void;
  onToggleAllOtherFoodVisibility: () => void;
  onAddFood: () => void;
  onAddMultipleFoods: () => void;
  onAddMeal: () => void;
  setSelectedFoodContext: (context: FoodContext | null) => void;
}

export const FoodGrid = React.memo(
  ({
    foodOptions,
    selectedMeal,
    currentMealSelection,
    onFoodSelect,
    onServingClick,
    onEditFood,
    onToggleVisibility,
    onToggleAllOtherFoodVisibility,
    onAddMultipleFoods,
    onAddMeal,
    setSelectedFoodContext,
  }: FoodGridProps) => {
    const hasNoFoodOptions = Object.values(foodOptions).every(
      (categoryFoods) => categoryFoods.length === 0
    );

    if (hasNoFoodOptions) {
      return (
        <div className="text-center text-gray-500 py-12">
          <p className="text-xl mb-4">No food options available</p>
          <p>Please add some foods to get started</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-14">
        <AddMenu
          onAddFood={() =>
            setSelectedFoodContext({
              mode: "add",
              category: "proteins",
              food: {} as Food,
            })
          }
          onAddMultipleFoods={onAddMultipleFoods}
          onAddMeal={onAddMeal}
          className="z-40 fixed bottom-4 right-4"
        />

        {(Object.entries(foodOptions) as [CategoryType, Food[]][]).map(
          ([category, foods]) => {
            const compatibleFoods = selectedMeal
              ? foods.filter((food) => food.meal?.includes(selectedMeal))
              : foods;

            if (compatibleFoods.length === 0) return null;

            return (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold capitalize">
                      {category}
                    </h3>
                    {category === "other" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleAllOtherFoodVisibility}
                        title="Toggle visibility for all 'Other' foods"
                      >
                        <Layers className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  {compatibleFoods.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <span>No food options available</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {compatibleFoods.map((food, index) => {
                        const validCategory = getValidCategory(category);
                        if (!validCategory || !food) return null;

                        const categoryValue = currentMealSelection?.[validCategory];
                        const isArrayCat = Array.isArray(categoryValue);

                        const selectedFoodInCategory = isArrayCat
                          ? (categoryValue as Food[]).find((c) => c.id === food.id) || null
                          : (categoryValue as Food | null) || null;

                        const isSelected = isArrayCat
                          ? (categoryValue as Food[]).some((c) => c.id === food.id)
                          : (categoryValue as Food | null)?.id === food.id;

                        return (
                          <FoodItem
                            key={food.id || index}
                            food={food}
                            category={validCategory}
                            index={index}
                            isSelected={!!isSelected}
                            selectedFoodInCategory={selectedFoodInCategory}
                            onSelect={() => onFoodSelect(validCategory, food)}
                            onServingClick={() =>
                              onServingClick(validCategory, food)
                            }
                            onEditFood={() => onEditFood(validCategory, food)}
                            isHidden={food.hiddenFromChild || false}
                            onToggleVisibility={() => onToggleVisibility(food)}
                            showVisibilityControls={true}
                            isChildView={false}
                            mealType={selectedMeal || "breakfast"}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    );
  }
);

FoodGrid.displayName = "FoodGrid";
