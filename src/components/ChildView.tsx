// src/components/ChildView.tsx
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { Food, CategoryType, MealType } from "@/types/food";

interface ChildViewProps {
  selectedMeal: MealType | null;
  foodOptions: Record<CategoryType, Food[]>;
  selections: Record<string, any>;
  selectedDay: string;
  onFoodSelect: (category: CategoryType, food: Food) => void;
}

export function ChildView({
  selectedMeal,
  foodOptions,
  selections,
  selectedDay,
  onFoodSelect,
}: ChildViewProps) {
  if (!selectedMeal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-6">What are you eating?</h2>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
            <Card
              key={meal}
              className="p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => onFoodSelect("meal", { name: meal } as Food)}
            >
              <div className="text-xl capitalize">{meal}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Helper function to check if category is complete
  const getCategoryStatus = (category: CategoryType) => {
    const isSelected = !!selections[selectedDay][selectedMeal][category];
    return { isSelected, className: isSelected ? "bg-green-50" : "bg-white" };
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-center mb-6 capitalize">
        Let's build your {selectedMeal}!
      </h2>

      {/* Category sections */}
      {(Object.entries(foodOptions) as [CategoryType, Food[]][]).map(
        ([category, foods]) => {
          const { isSelected, className } = getCategoryStatus(
            category as CategoryType
          );

          return (
            <div key={category} className={`p-4 rounded-lg ${className}`}>
              <h3 className="text-xl font-semibold capitalize mb-4">
                Choose your {category}
                {isSelected && <span className="text-green-500 ml-2">✓</span>}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {foods.map((food) => {
                  const isThisFoodSelected =
                    selections[selectedDay][selectedMeal][category]?.name ===
                    food.name;

                  return (
                    <Card
                      key={food.name}
                      className={`relative cursor-pointer transition-transform hover:scale-105 
                      ${isThisFoodSelected ? "ring-2 ring-green-500" : ""}`}
                      onClick={() =>
                        onFoodSelect(category as CategoryType, food)
                      }
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
                        {isThisFoodSelected && (
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
                })}
              </div>
            </div>
          );
        }
      )}

      {/* Progress indicator */}
      <div className="fixed bottom-4 left-4 right-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
          <div className="text-center mb-2">Complete your plate!</div>
          <div className="flex justify-around">
            {["proteins", "fruits", "grains", "vegetables"].map((category) => {
              const isComplete =
                !!selections[selectedDay][selectedMeal][category];
              return (
                <div
                  key={category}
                  className={`flex flex-col items-center ${
                    isComplete ? "text-green-500" : "text-gray-400"
                  }`}
                >
                  <span className="text-2xl">
                    {category === "fruits"
                      ? "🍎"
                      : category === "vegetables"
                      ? "🥕"
                      : category === "proteins"
                      ? "🥚"
                      : "🥖"}
                  </span>
                  <span className="text-xs capitalize">{category}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
