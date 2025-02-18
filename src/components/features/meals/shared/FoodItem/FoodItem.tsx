import React, { useMemo } from "react";
import { Sliders, Edit } from "lucide-react";
import { CategoryType, Food } from "@/types/food";
import { getFoodImageSource } from "@/utils/imageUtils";
import Image from "next/image";
import { EyeOff, Eye } from "lucide-react";
import { FoodScoreDisplay } from "../FoodScoreDisplay";

interface FoodItemProps {
  food: Food;
  category: CategoryType;
  isSelected: boolean;
  index: number;
  selectedFoodInCategory: Food | null;
  onSelect: () => void;
  onServingClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onEditFood?: () => void;
  isHidden: boolean;
  onToggleVisibility: () => void;
  showVisibilityControls?: boolean;
  mealType: string;
  isChildView?: boolean;
}

export const FoodItem = ({
  food,
  category,
  index,
  isSelected,
  selectedFoodInCategory,
  onSelect,
  onServingClick,
  onEditFood,
  isHidden,
  onToggleVisibility,
  mealType,
  showVisibilityControls = false,
  isChildView = false,
}: FoodItemProps) => {
  const imageSource = useMemo(() => getFoodImageSource(food), [food]);

  const classes = [
    "relative",
    "p-4",
    "rounded-lg",
    "transition-all",
    "duration-200",
    "cursor-pointer",
    isSelected
      ? !isChildView
        ? "bg-blue-100"
        : "bg-white"
      : "hover:bg-gray-50 bg-white",
    isSelected ? "ring-2" : "",
    isSelected ? (isChildView ? "ring-green-500" : "ring-blue-500") : "",
    isHidden ? "opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-testid={`${category}-${mealType}-${index}`}
      className={classes}
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
              {food.analysis && <FoodScoreDisplay analysis={food.analysis} />}
              {isHidden && (
                <div
                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded"
                  title="This food is hidden from children's view"
                >
                  Hidden
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {food.servingSize} {food.servingSizeUnit}
            </div>
          </div>
        </div>
        {showVisibilityControls && (
          <div
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            title={isHidden ? "Show to child" : "Hide from child"}
          >
            {isHidden ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </div>
        )}
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
            {`${selectedFoodInCategory.servings} serving(s) • ${Math.round(
              selectedFoodInCategory.adjustedCalories
            )} cal total`}
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
                data-testid="edit-food-icon"
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
