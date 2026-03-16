import { Progress } from "@/components/ui/progress";

export interface ConsumptionFood {
  name: string;
  percentageEaten: number;
  notes?: string;
}

export interface ConsumptionData {
  foods: ConsumptionFood[];
  summary: string;
}

interface ConsumptionDisplayProps {
  foods: ConsumptionFood[];
}

export function ConsumptionDisplay({ foods }: ConsumptionDisplayProps) {
  return (
    <div className="space-y-2">
      {foods.map((food, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">{food.name}</span>
            <span className="text-sm text-gray-600">
              {food.percentageEaten}% eaten
            </span>
          </div>
          <Progress value={food.percentageEaten} className="h-2" />
          {food.notes && (
            <p className="text-sm text-gray-600 mt-1">{food.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
