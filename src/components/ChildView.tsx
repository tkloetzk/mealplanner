// src/components/ChildView.tsx
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { MealType, CategoryType, Food, MealPlan } from "@/types/food";

interface ChildViewProps {
  selectedMeal: MealType | null;
  foodOptions: Record<CategoryType, Food[]>;
  selections: MealPlan;
  selectedDay: string;
  onFoodSelect: (category: CategoryType, food: Food) => void;
  onMealSelect: (meal: MealType) => void;
}

export function ChildView({
  selectedMeal,
  foodOptions,
  selections,
  selectedDay,
  onFoodSelect,
  onMealSelect,
}: ChildViewProps) {
  const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

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
      <h2 className="text-2xl font-bold text-center mb-6 capitalize">
        {selectedMeal}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(foodOptions).map(([category, foods]) =>
          foods.map((food) => {
            const isSelected =
              selections[selectedDay][selectedMeal][category as CategoryType]
                ?.name === food.name;

            return (
              <Card
                key={food.name}
                className={`relative cursor-pointer transition-transform hover:scale-105 
                  ${isSelected ? "ring-2 ring-green-500" : ""}`}
                onClick={() => onFoodSelect(category as CategoryType, food)}
              >
                {/* Image Container */}
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">
                        {category === "fruits"
                          ? "🍎"
                          : category === "vegetables"
                          ? "🥕"
                          : category === "proteins"
                          ? "🥚"
                          : category === "grains"
                          ? "🥖"
                          : "🍽️"}
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Food Info */}
                <div className="p-3 text-center">
                  <h3 className="font-medium text-lg">{food.name}</h3>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
