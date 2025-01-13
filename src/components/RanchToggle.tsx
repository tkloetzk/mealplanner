// components/RanchToggle.tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Droplets, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export const RANCH_OPTION = {
  name: "Ranch Dressing",
  calories: 65,
  protein: 0,
  carbs: 0.5,
  fat: 6.5,
  servingSize: "1",
  servingSizeUnit: "tbsp",
  category: "condiments" as const,
  score: "e",
  upc: "071100005509",
  novaGroup: 4,
  nutrientLevels: {
    fat: "high",
    salt: "high",
    "saturated-fat": "high",
    sugars: "low",
  },
  ingredients:
    "vegetable oil (soybean and/or canola), water, sugar, salt, nonfat buttermilk, egg yolk, natural flavors, less than 1% of: spices, garlic*, onion*, vinegar, phosphoric acid, xanthan gum, modified food starch, monosodium glutamate, artificial flavors, disodium phosphate, sorbic acid and calcium disodium edta added to preserve freshness, disodium inosinate , guanylate,",
};

interface RanchToggleProps {
  isSelected: boolean;
  servings: number;
  onChange: (value: boolean, servings: number) => void;
}

export function RanchToggle({
  isSelected,
  servings,
  onChange,
}: RanchToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleServingsChange = (newServings: number) => {
    if (newServings >= 1 && newServings <= 3) {
      onChange(true, newServings);
    }
  };

  const getNutritionForServings = (servings: number) => ({
    calories: RANCH_OPTION.calories * servings,
    protein: RANCH_OPTION.protein * servings,
    carbs: RANCH_OPTION.carbs * servings,
    fat: RANCH_OPTION.fat * servings,
  });

  const getServingVisual = () => {
    return (
      <div className="flex gap-1">
        {[...Array(3)].map((_, index) => (
          <Droplets
            key={index}
            className={`h-4 w-4 ${
              index < servings ? "text-blue-500" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <Label className="text-base">Ranch Dressing</Label>
                <div className="text-sm text-gray-600">
                  {RANCH_OPTION.calories} calories per tablespoon
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isSelected && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServingsChange(servings - 1)}
                    disabled={servings <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col items-center">
                    <span className="w-8 text-center">{servings}</span>
                    {getServingVisual()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServingsChange(servings + 1)}
                    disabled={servings >= 3}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 ml-2">tbsp</span>
                </div>
              )}
              <Switch
                checked={isSelected}
                onCheckedChange={(checked) => onChange(checked, servings)}
              />
            </div>
          </div>

          {/* Nutrition Toggle Button */}
          {isSelected && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700 transition-colors w-full"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">Nutrition Details</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </Button>
            </div>
          )}
        </div>

        {/* Expandable Nutrition Section */}
        {isSelected && isExpanded && (
          <div className="border-t border-gray-100 overflow-hidden transition-all duration-200 ease-in-out">
            <div className="px-4 py-3 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">
                Nutrition for {servings} tbsp:
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between p-2 bg-white rounded shadow-sm">
                  <span className="text-gray-600">Calories:</span>
                  <span className="font-medium">
                    {getNutritionForServings(servings).calories}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded shadow-sm">
                  <span className="text-gray-600">Protein:</span>
                  <span className="font-medium">
                    {getNutritionForServings(servings).protein.toFixed(1)}g
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded shadow-sm">
                  <span className="text-gray-600">Carbs:</span>
                  <span className="font-medium">
                    {getNutritionForServings(servings).carbs.toFixed(1)}g
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded shadow-sm">
                  <span className="text-gray-600">Fat:</span>
                  <span className="font-medium">
                    {getNutritionForServings(servings).fat.toFixed(1)}g
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
