import { Card } from "@/components/ui/card";
import { MEAL_TYPES } from "@/constants";
import { MealType } from "@/types/food";

interface MealSelectorProps {
  onMealSelect: (meal: MealType) => void;
}
export function MealSelector({ onMealSelect }: MealSelectorProps) {
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
