import { MealType, CategoryType, Food, MealPlan, DayType } from "@/types/food";
import { MealSelector } from "./MealSelector";
import { CategoryFoodGrid } from "./CategoryFoodGrid";

interface ChildViewProps {
  selectedMeal: MealType | null;
  foodOptions: Record<CategoryType, Food[]>;
  selections: MealPlan;
  selectedDay: DayType;
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
  // Initial meal selection view
  if (!selectedMeal) {
    return <MealSelector onMealSelect={onMealSelect} />;
  }

  // Food selection view
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-8 capitalize">
        {selectedMeal}
      </h2>
      <div className="space-y-10">
        {(Object.entries(foodOptions) as Array<[CategoryType, Food[]]>).map(
          ([category, foods]) => {
            // Filter foods for current meal type
            const compatibleFoods = foods.filter((food) =>
              food.meal?.includes(selectedMeal)
            );

            if (compatibleFoods.length === 0) return null;

            return (
              <CategoryFoodGrid
                key={category}
                category={category}
                foods={compatibleFoods}
                selectedDay={selectedDay}
                selectedMeal={selectedMeal}
                selections={selections}
                onFoodSelect={onFoodSelect}
              />
            );
          }
        )}
      </div>
    </div>
  );
}
