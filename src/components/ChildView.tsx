import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { MealType, CategoryType, Food, MealPlan, DayType } from "@/types/food";

interface ChildViewProps {
  selectedMeal: MealType | null;
  foodOptions: Record<CategoryType, Food[]>;
  selections: MealPlan;
  selectedDay: DayType;
  onFoodSelect: (category: CategoryType, food: Food) => void;
  onMealSelect: (meal: MealType) => void;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const CATEGORY_STYLES: Record<CategoryType, string> = {
  fruits: "border-l-4 border-red-400 border-r border-t border-b",
  vegetables: "border-l-4 border-green-400 border-r border-t border-b",
  proteins: "border-l-4 border-blue-400 border-r border-t border-b",
  grains: "border-l-4 border-yellow-400 border-r border-t border-b",
};

const CATEGORY_EMOJIS: Record<CategoryType, string> = {
  fruits: "🍎",
  vegetables: "🥕",
  proteins: "🥚",
  grains: "🥖",
};

const getImageSource = (food: Food) => {
  return food.imagePath
    ? `/images/food/${food.imagePath}`
    : food.imageUrl ?? null;
};

export function ChildView({
  selectedMeal,
  foodOptions,
  selections,
  selectedDay,
  onFoodSelect,
  onMealSelect,
}: ChildViewProps) {
  if (!selectedDay) {
    console.log(selectedDay, new Date());
  }

  if (!selectedMeal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-6">What are you eating?</h2>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {MEAL_TYPES.map((meal) => (
            <Card
              key={meal}
              className="p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => onMealSelect(meal)}
            >
              <div className="text-xl capitalize">{meal}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-8 capitalize">
        {selectedMeal}
      </h2>
      <div className="space-y-10">
        {(Object.entries(foodOptions) as [CategoryType, Food[]][]).map(
          ([category, foods]) => {
            const compatibleFoods = foods.filter((food) =>
              food.meal?.includes(selectedMeal)
            );

            if (compatibleFoods.length === 0) {
              return null;
            }

            return (
              <div key={category} className="relative animate-fade-in">
                <div
                  className={`rounded-xl bg-white shadow-sm ${CATEGORY_STYLES[category]}`}
                >
                  <div
                    className={`px-6 py-3 border-b rounded-t-xl ${CATEGORY_STYLES[category]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {CATEGORY_EMOJIS[category] || "🍽️"}
                      </span>
                      <h3 className="text-xl font-semibold capitalize">
                        Choose your {category}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {compatibleFoods.map((food) => {
                        const isSelected =
                          selections?.[selectedDay]?.[selectedMeal]?.[category]
                            ?.name === food.name;
                        const imageSource = getImageSource(food);

                        return (
                          <Card
                            key={food.name}
                            className={`relative cursor-pointer transition-transform hover:scale-105 ${
                              isSelected
                                ? "ring-2 ring-green-500"
                                : "hover:shadow-md"
                            }`}
                            onClick={() =>
                              onFoodSelect(category as CategoryType, food)
                            }
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
                                    {CATEGORY_EMOJIS[category] || "🍽️"}
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
                              <h3 className="font-medium text-lg">
                                {food.name}
                              </h3>
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
        )}
      </div>
    </div>
  );
}
