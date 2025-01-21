// components/FoodAnalysisDisplay.tsx
import { cn } from "@/lib/utils";

interface AnalyzedFood {
  name: string;
  description: string;
  portionSize: string;
  visualCharacteristics: string;
  nutritionalAnalysis: string;
  suggestions: string;
  concerns: string;
}

interface AnalysisResponse {
  foods: AnalyzedFood[];
  summary: string;
}

interface FoodAnalysisDisplayProps {
  analysis: AnalysisResponse;
}

export function FoodAnalysisDisplay({ analysis }: FoodAnalysisDisplayProps) {
  return (
    <div>
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium mb-2">Summary</h4>
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
      </div>
      {analysis.foods.map((food, index) => (
        <div key={index} className="space-y-3 pt-3">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">{food.name}</h3>
            <p className="text-sm text-muted-foreground">{food.description}</p>
          </div>

          <div className="space-y-3">
            <InfoSection title="Portion Size" content={food.portionSize} />
            <InfoSection
              title="Visual Characteristics"
              content={food.visualCharacteristics}
            />
            <InfoSection
              title="Nutritional Analysis"
              content={food.nutritionalAnalysis}
            />
            <InfoSection title="Suggestions" content={food.suggestions} />
            <InfoSection
              title="Health Concerns"
              content={food.concerns}
              variant="warning"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  content: string;
  variant?: "default" | "warning";
}

function InfoSection({
  title,
  content,
  variant = "default",
}: InfoSectionProps) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <p
        className={cn(
          "text-sm",
          variant === "warning" ? "text-amber-600" : "text-gray-700"
        )}
      >
        {content}
      </p>
    </div>
  );
}
