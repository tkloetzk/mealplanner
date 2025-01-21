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
  onFoodSelect: (category: keyof typeof CATEGORY_STYLES, food: Food) => void;
}

// Helper function to check if a food is selected
const isFoodSelected = (
  selections: MealPlan,
  selectedDay: DayType,
  selectedMeal: MealType,
  category: CategoryType,
  foodName: string
): boolean => {
  // @ts-expect-error Idk what to do
  return selections[selectedDay]?.[selectedMeal]?.[category]?.name === foodName;
};

export function CategoryFoodGrid({
  category,
  foods,
  selectedDay,
  selectedMeal,
  selections,
  onFoodSelect,
}: CategoryFoodGridProps) {
  return (
    <div className="relative animate-fade-in">
      <div
        className={`rounded-xl bg-white shadow-sm ${CATEGORY_STYLES[category]}`}
      >
        {/* Category Header */}
        <div
          className={`px-6 py-3 border-b rounded-t-xl ${CATEGORY_STYLES[category]}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{CATEGORY_EMOJIS[category]}</span>
            <h3 className="text-xl font-semibold capitalize">
              Choose your {category}
            </h3>
          </div>
        </div>

        {/* Food Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {foods.map((food) => {
              const isSelected = isFoodSelected(
                selections,
                selectedDay,
                selectedMeal,
                category,
                food.name
              );
              const imageSource = getFoodImageSource(food);

              return (
                <Card
                  key={food.name}
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
                          {CATEGORY_EMOJIS[category]}
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 bg-green-500 rounded-full p-2"
                        data-testid="checkmark-icon"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-medium text-lg">{food.name}</h3>
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
