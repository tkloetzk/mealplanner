// src/components/features/meals/ChildView/CategoryFoodGrid.tsx

import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { CategoryType, Food, MealType, DayType, MealPlan } from "@/types/food";
import { getFoodImageSource } from "@/utils/imageUtils";
import Image from "next/image";
import { CATEGORY_EMOJIS, CATEGORY_STYLES } from "@/constants";

interface CategoryFoodGridProps {
  category: keyof typeof CATEGORY_STYLES;
  foods: Food[];
  selectedDay: DayType;
  selectedMeal: MealType;
  selections: MealPlan;
  onFoodSelect: (category: CategoryType, food: Food) => void;
  isCondimentGrid?: boolean;
}

export function CategoryFoodGrid({
  category,
  foods,
  selectedDay,
  selectedMeal,
  selections,
  onFoodSelect,
  isCondimentGrid = false,
}: CategoryFoodGridProps) {
  const isFoodSelected = (food: Food): boolean => {
    if (isCondimentGrid) {
      // For condiments, check if it exists in the condiments array
      return (
        // @ts-expect-error idk
        selections[selectedDay]?.[selectedMeal]?.condiments?.some(
          // @ts-expect-error idk
          (c: unknown) => c.foodId === food.id
        ) ?? false
      );
    }

    // For other categories, check if it's the selected item
    // @ts-expect-error idk
    return selections[selectedDay]?.[selectedMeal]?.[category]?.id === food.id;
  };

  const getServingInfo = (food: Food) => {
    if (!isCondimentGrid) return null;

    // @ts-expect-error idk
    const condiment = selections[selectedDay]?.[selectedMeal]?.condiments?.find(
      // @ts-expect-error idk
      (c) => c.foodId === food.id
    );

    if (!condiment) return null;

    return `${condiment.servings} ${food.servingSizeUnit}`;
  };

  return (
    <div className="relative animate-fade-in">
      <div
        className={`rounded-xl bg-white shadow-sm ${CATEGORY_STYLES[category]}`}
      >
        <div
          className={`px-6 py-3 border-b rounded-t-xl ${CATEGORY_STYLES[category]}`}
        >
          <div className="flex items-center gap-2">
            {/** @ts-expect-error idk */}
            <span className="text-2xl">{CATEGORY_EMOJIS[category]}</span>
            <h3 className="text-xl font-semibold capitalize">
              {isCondimentGrid ? "Add Toppings" : `Choose your ${category}`}
            </h3>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {foods.map((food, index) => {
              const isSelected = isFoodSelected(food);
              const imageSource = getFoodImageSource(food);
              const servingInfo = getServingInfo(food);

              return (
                <Card
                  key={food.id}
                  data-testid={`${category}-${selectedMeal}-${index}`}
                  className={`relative cursor-pointer transition-transform hover:scale-105 ${
                    isSelected ? "ring-2 ring-green-500" : "hover:shadow-md"
                  }`}
                  onClick={() => onFoodSelect(category, food)}
                >
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {imageSource ? (
                      <Image
                        src={imageSource}
                        alt={food.name}
                        fill
                        style={{ objectFit: "cover" }}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl">
                          {/** @ts-expect-error idk */}
                          {CATEGORY_EMOJIS[category]}
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-medium text-lg">{food.name}</h3>
                    {servingInfo && (
                      <div className="text-sm text-gray-600 mt-1">
                        {servingInfo}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
