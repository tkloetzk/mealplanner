// components/ServingSelector.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Food, SelectedFood, ServingSizeUnit } from "@/types/food";
import { calculateNutritionForServing } from "@/utils/foodMigration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServingSelectorProps {
  food: Food;
  currentServings: number;
  onConfirm: (adjustedFood: SelectedFood) => void;
  onCancel: () => void;
  compact?: boolean;
}

export const ServingSelector: React.FC<ServingSelectorProps> = ({
  food,
  currentServings,
  onConfirm,
  onCancel,
  compact = false,
}) => {
  const [servings, setServings] = useState(food.servings || currentServings);
  const [servingUnit, setServingUnit] = useState<ServingSizeUnit>(
    food.servingSizes?.[0]?.unit ?? food.servingSizeUnit
  );

  useEffect(() => {
    setServings(food.servings || currentServings);
  }, [food.servings, currentServings]);

  const computeNutrition = (validServings: number) => {
    if (food.baseNutritionPer100g && food.servingSizes?.[0]?.gramsEquivalent) {
      return calculateNutritionForServing(
        food.baseNutritionPer100g,
        food.servingSizes[0].gramsEquivalent,
        validServings
      );
    }
    return {
      calories: food.calories * validServings,
      protein: food.protein * validServings,
      carbs: food.carbs * validServings,
      fat: food.fat * validServings,
    };
  };

  const createAdjustedFood = (validServings: number): SelectedFood => {
    const nutrition = computeNutrition(validServings);
    return {
      ...food,
      servings: validServings,
      servingSizeUnit: servingUnit,
      adjustedCalories: Math.round(nutrition.calories),
      adjustedProtein: nutrition.protein,
      adjustedCarbs: nutrition.carbs,
      adjustedFat: nutrition.fat,
    };
  };

  const updateServings = (newServings: number) => {
    const validServings = Math.max(0.25, Math.min(5, newServings));
    setServings(validServings);

    const adjustedFood = createAdjustedFood(validServings);
    if (compact) {
      onConfirm(adjustedFood);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      updateServings(parsed);
    }
  };

  const handleConfirm = () => {
    onConfirm(createAdjustedFood(servings));
  };

  const ServingControls = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => updateServings(servings - 0.25)}
        data-testid="decrement-serving"
      >
        -
      </Button>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={servings}
          onChange={handleInputChange}
          onBlur={() => {
            const validServings = Math.max(0.25, Math.min(5, servings));
            if (validServings !== servings) {
              updateServings(validServings);
            }
          }}
          step="0.25"
          min="0.25"
          max="5"
          className="w-20 text-center"
          data-testid="custom-serving-input"
        />
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {compact ? "servings" : `× ${food.servingSizes?.[0]?.label ?? `${food.servingSize} ${food.servingSizeUnit}`}`}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => updateServings(servings + 0.25)}
        data-testid="increment-serving"
      >
        +
      </Button>
    </div>
  );

  const ServingUnitSelector = () => (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-sm text-gray-600">Unit:</span>
      <Select
        value={servingUnit}
        onValueChange={(value: ServingSizeUnit) => setServingUnit(value)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="g">grams</SelectItem>
          <SelectItem value="ml">milliliters</SelectItem>
          <SelectItem value="oz">ounces</SelectItem>
          <SelectItem value="tsp">tsp</SelectItem>
          <SelectItem value="tbsp">tbsp</SelectItem>
          <SelectItem value="cup">cups</SelectItem>
          <SelectItem value="piece">pieces</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  if (compact) {
    return <ServingControls />;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Base serving: {food.servingSizes?.[0]?.label ?? `${food.servingSize} ${food.servingSizeUnit}`}
      </div>

      <ServingControls />
      <ServingUnitSelector />

      <div className="text-sm text-gray-600">
        {food.servingSizes?.[0] ? (
          <>Total amount: {(food.servingSizes[0].amount * servings).toFixed(2)} {food.servingSizes[0].unit}</>
        ) : (
          <>Total amount: {(parseFloat(food.servingSize) * servings).toFixed(2)} {servingUnit}</>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
        {(() => {
          const n = computeNutrition(servings);
          return (
            <>
              <div className="flex justify-between">
                <span>Calories:</span>
                <span className="font-medium" data-testid="calories-incremented">
                  {Math.round(n.calories)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Protein:</span>
                <span className="font-medium">{n.protein.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbs:</span>
                <span className="font-medium">{n.carbs.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat:</span>
                <span className="font-medium">{n.fat.toFixed(1)}g</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          data-testid="serving-selector-confirm"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};
