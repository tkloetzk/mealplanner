// components/ConsumptionAnalysis.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ConsumptionData {
  foods: Array<{
    name: string;
    percentageEaten: number;
    notes?: string;
  }>;
  summary: string;
}

interface ConsumptionAnalysisProps {
  data: ConsumptionData;
}

export function ConsumptionAnalysis({ data }: ConsumptionAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Consumption Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.foods.map((food, index) => (
            <div key={index} className="space-y-2">
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

          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-2">Summary</h4>
            <p className="text-sm text-gray-600">{data.summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
