// components/ServingSelector.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Check, X } from "lucide-react";
import { Food, SelectedFood } from "@/types/food";

const PRESET_SERVINGS = [
  { label: "¼", value: 0.25 },
  { label: "½", value: 0.5 },
  { label: "¾", value: 0.75 },
  { label: "1", value: 1 },
  { label: "1½", value: 1.5 },
  { label: "2", value: 2 },
];

// In ServingSelector.tsx
interface ServingSelectorProps {
  food: Food;
  currentServings?: number; // Add this prop
  onConfirm: (adjustedFood: SelectedFood) => void;
  onCancel: () => void;
}

export function ServingSelector({
  food,
  currentServings = 1,
  onConfirm,
  onCancel,
}: ServingSelectorProps) {
  // Initialize with currentServings if provided, otherwise use 1
  const [servings, setServings] = useState(currentServings);

  const adjustNutrition = (servingCount: number): SelectedFood => {
    return {
      ...food,
      servings: servingCount,
      adjustedCalories: food.calories * servingCount,
      adjustedProtein: food.protein * servingCount,
      adjustedCarbs: food.carbs * servingCount,
      adjustedFat: food.fat * servingCount,
    };
  };

  const handleServingChange = (newServings: number) => {
    if (newServings >= 0.25 && newServings <= 5) {
      setServings(newServings);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{food.name}</h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Serving size: {food.servingSize} {food.servingSizeUnit}
        </div>

        {/* Preset Servings */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {PRESET_SERVINGS.map(({ label, value }) => (
            <Button
              key={value}
              variant={servings === value ? "default" : "outline"}
              className="w-full"
              onClick={() => handleServingChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Custom Serving Input */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleServingChange(servings - 0.25)}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Input
            type="number"
            value={servings}
            step="0.25"
            min="0.25"
            max="5"
            className="w-20 text-center"
            data-testid="custom-serving-input"
            onChange={(e) => handleServingChange(parseFloat(e.target.value))}
          />

          <Button
            variant="outline"
            size="icon"
            data-testid="increment-serving"
            onClick={() => handleServingChange(servings + 0.25)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Nutrition Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg text-sm">
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(adjustNutrition(servings))}>
            <Check className="h-4 w-4 mr-2" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
