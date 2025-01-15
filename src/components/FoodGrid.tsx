// components/FoodGrid.tsx
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { CategoryType, Food, MealType, SelectedFood } from "@/types/food";
import FoodItem from "./FoodItem";

interface FoodGridProps {
  category: CategoryType;
  foods: Food[];
  selectedMeal: MealType;
  selectedFood: SelectedFood | null;
  onFoodSelect: (food: Food) => void;
  onServingClick: (e: React.MouseEvent<HTMLDivElement>, food: Food) => void;
}

export const FoodGrid = ({
  category,
  foods,
  selectedMeal,
  selectedFood,
  onFoodSelect,
  onServingClick,
}: FoodGridProps) => {
  const compatibleFoods = useMemo(
    () => foods.filter((food) => food.meal?.includes(selectedMeal)),
    [foods, selectedMeal]
  );

  if (compatibleFoods.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold capitalize mb-3">{category}</h3>
        <div className="space-y-2">
          {compatibleFoods.map((food) => (
            <FoodItem
              key={food.name}
              food={food}
              isSelected={selectedFood?.name === food.name}
              selectedFoodInCategory={selectedFood}
              onSelect={() => onFoodSelect(food)}
              onServingClick={(e) => onServingClick(e, food)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
