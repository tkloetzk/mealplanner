import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Food, SelectedFood } from "@/types/food";

interface MealServingSelectorProps {
  food: Food;
  currentServings: number;
  onConfirm: (adjustedFood: SelectedFood) => void;
  onCancel: () => void;
}

export const MealServingSelector: React.FC<MealServingSelectorProps> = ({
  food,
  currentServings,
  onConfirm,
  onCancel,
}) => {
  const [servings, setServings] = useState(currentServings);

  const handleServingChange = (value: number) => {
    const newServings = Math.max(0.25, value);
    setServings(newServings);
  };

  const handleConfirm = () => {
    const adjustedFood: SelectedFood = {
      ...food,
      servings,
      adjustedCalories: Math.round(food.calories * servings),
      adjustedProtein: food.protein * servings,
      adjustedCarbs: food.carbs * servings,
      adjustedFat: food.fat * servings,
    };
    onConfirm(adjustedFood);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Base serving: {food.servingSize} {food.servingSizeUnit}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleServingChange(servings - 0.25)}
          data-testid="decrement-serving"
        >
          -
        </Button>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={servings}
            onChange={(e) => handleServingChange(parseFloat(e.target.value))}
            step="0.25"
            min="0.25"
            max="5"
            className="w-20 text-center"
            data-testid="custom-serving-input"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            × {food.servingSize} {food.servingSizeUnit}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleServingChange(servings + 0.25)}
          data-testid="increment-serving"
        >
          +
        </Button>
      </div>

      <div className="text-sm text-gray-600">
        Total amount: {(parseFloat(food.servingSize) * servings).toFixed(2)}{" "}
        {food.servingSizeUnit}
      </div>

      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex justify-between">
          <span>Calories:</span>
          <span className="font-medium" data-testid="calories-incremented">
            {Math.round(food.calories * servings)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Protein:</span>
          <span className="font-medium">
            {(food.protein * servings).toFixed(1)}g
          </span>
        </div>
        <div className="flex justify-between">
          <span>Carbs:</span>
          <span className="font-medium">
            {(food.carbs * servings).toFixed(1)}g
          </span>
        </div>
        <div className="flex justify-between">
          <span>Fat:</span>
          <span className="font-medium">
            {(food.fat * servings).toFixed(1)}g
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
};
