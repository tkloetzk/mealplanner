// components/ConsumptionAnalysis.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ConsumptionData,
  ConsumptionDisplay,
} from "@/components/features/food/ConsumptionDisplay/ConsumptionDisplay";

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
          <ConsumptionDisplay foods={data.foods} />

          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-2">Summary</h4>
            <p className="text-sm text-gray-600">{data.summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
