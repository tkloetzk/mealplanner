import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { CategoryType, Food, MealType, DayType, MealPlan } from "@/types/food";

// Define type-safe category styles mapping
const CATEGORY_STYLES: Record<CategoryType, string> = {
  fruits: "border-l-4 border-red-400 border-r border-t border-b",
  vegetables: "border-l-4 border-green-400 border-r border-t border-b",
  proteins: "border-l-4 border-blue-400 border-r border-t border-b",
  grains: "border-l-4 border-yellow-400 border-r border-t border-b",
  milk: "border-l-4 border-purple-400 border-r border-t border-b",
} as const;

// Create type-safe emoji mapping
const CATEGORY_EMOJIS: Record<CategoryType, string> = {
  fruits: "🍎",
  vegetables: "🥕",
  proteins: "🥚",
  grains: "🥖",
  milk: "🥛",
} as const;

interface CategoryFoodGridProps {
  category: CategoryType;
  foods: Food[];
  selectedDay: DayType;
  selectedMeal: MealType;
  selections: MealPlan;
  onFoodSelect: (category: CategoryType, food: Food) => void;
}

// Helper function to get image source with proper typing
const getImageSource = (food: Food): string | null => {
  if (food.imagePath) {
    return `/images/food/${food.imagePath}`;
  }
  return food.imageUrl ?? null;
};

// Helper function to check if a food is selected
const isFoodSelected = (
  selections: MealPlan,
  selectedDay: DayType,
  selectedMeal: MealType,
  category: CategoryType,
  foodName: string
): boolean => {
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
              const imageSource = getImageSource(food);

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
                      <img
                        src={imageSource}
                        alt={food.name}
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
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
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
