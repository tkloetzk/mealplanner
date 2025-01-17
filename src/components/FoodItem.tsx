import React, { useMemo } from "react";
import { Sliders, Edit } from "lucide-react";
import { NutriScore } from "./NutriScore";
import { CategoryType, Food, SelectedFood } from "@/types/food";
import { getFoodImageSource } from "@/utils/imageUtils";
import Image from "next/image";

interface FoodItemProps {
  food: Food;
  category: CategoryType;
  isSelected: boolean;
  index: number;
  selectedFoodInCategory: SelectedFood | null;
  onSelect: () => void;
  onServingClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onEditFood?: () => void;
}

const FoodItem: React.FC<FoodItemProps> = ({
  food,
  category,
  index,
  isSelected,
  selectedFoodInCategory,
  onSelect,
  onServingClick,
  onEditFood,
}) => {
  const imageSource = useMemo(() => getFoodImageSource(food), [food]);

  return (
    <div
      data-testid={`${category}-${index}`}
      className={`relative p-4 rounded-lg transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? "bg-blue-100 ring-2 ring-blue-500"
            : "hover:bg-gray-50 bg-white"
        }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          {imageSource && (
            <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={imageSource}
                alt={food.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{food.name}</h4>
              {food.score && <NutriScore score={food.score} />}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {food.servingSize} {food.servingSizeUnit}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-medium">{food.calories} cal</div>
          <div className="text-sm text-gray-600 mt-1">
            P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
          </div>
        </div>
      </div>

      {isSelected && selectedFoodInCategory && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="text-sm font-medium text-blue-600">
            {selectedFoodInCategory.servings} serving(s) •{" "}
            {Math.round(selectedFoodInCategory.adjustedCalories)} cal total
          </div>
          <div className="flex items-center gap-2">
            {onEditFood && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEditFood();
                }}
                className="p-2 rounded-full hover:bg-blue-200 transition-colors"
                title="Edit Food"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </div>
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onServingClick(e);
              }}
              className="p-2 rounded-full hover:bg-blue-200 transition-colors"
              title="Adjust Servings"
            >
              <Sliders className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(FoodItem);
