import React, { useMemo } from "react";
import { Sliders } from "lucide-react";
import { NutriScore } from "./NutriScore";
import { Food, SelectedFood } from "@/types/food";
import { getFoodImageSource } from "@/utils/imageUtils";
import Image from "next/image";

interface FoodItemProps {
  food: Food;
  isSelected: boolean;
  selectedFoodInCategory: SelectedFood | null;
  onSelect: () => void;
  onServingClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const FoodItem: React.FC<FoodItemProps> = ({
  food,
  isSelected,
  selectedFoodInCategory,
  onSelect,
  onServingClick,
}) => {
  const imageSource = useMemo(() => getFoodImageSource(food), [food]);

  const foodDetails = useMemo(() => {
    return (
      <div className="flex justify-between items-start">
        <div className="flex-1 flex items-center gap-2">
          {imageSource && (
            <div className="w-16 h-16 relative rounded-lg overflow-hidden mr-2">
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
              <span>{food.name}</span>
              {food.score && <NutriScore score={food.score} />}
            </div>
            <div className="text-sm text-gray-600">
              {food.servingSize} {food.servingSizeUnit}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div>{food.calories} cal</div>
          <div className="text-sm text-gray-600">
            P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
          </div>
        </div>
      </div>
    );
  }, [food, imageSource]);

  const selectedDetails = useMemo(() => {
    if (!isSelected || !selectedFoodInCategory) return null;

    return (
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
        <div className="text-sm text-blue-600">
          {selectedFoodInCategory.servings} serving(s) •{" "}
          {Math.round(selectedFoodInCategory.adjustedCalories)} cal total
        </div>
        <div
          onClick={onServingClick}
          className="p-1 rounded hover:bg-blue-200 transition-colors"
          title="Adjust serving size"
        >
          <Sliders className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    );
  }, [isSelected, selectedFoodInCategory, onServingClick]);

  return (
    <div className="relative flex flex-col">
      <button
        onClick={onSelect}
        className={`w-full p-2 text-left rounded hover:bg-gray-100 ${
          isSelected ? "bg-blue-100" : ""
        }`}
      >
        {foodDetails}
        {selectedDetails}
      </button>
    </div>
  );
};

export default FoodItem;
