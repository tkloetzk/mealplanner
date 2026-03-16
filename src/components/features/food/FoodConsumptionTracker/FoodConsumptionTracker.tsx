import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCapture } from "@/components/ImageCapture";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSelection } from "@/types/food";
import {
  ConsumptionData,
  ConsumptionDisplay,
} from "@/components/features/food/ConsumptionDisplay/ConsumptionDisplay";

interface FoodConsumptionTrackerProps {
  selectedFoods: MealSelection;
  onAnalysisComplete: (consumptionData: ConsumptionData) => void;
}

export function FoodConsumptionTracker({
  selectedFoods,
  onAnalysisComplete,
}: FoodConsumptionTrackerProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ConsumptionData | null>(null);

  const analyzePlatePhoto = async (imageData: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Create a description of the original meal for AI context
      const mealDescription = Object.entries(selectedFoods)
        .filter(([, food]) => food !== null)
        .map(([category, food]) => `${category}: ${food?.name}`)
        .join(", ");

      const response = await fetch("/api/analyze-food-consumption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          originalMeal: mealDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze plate photo");
      }

      const data = await response.json();
      setAnalysis(data);
      onAnalysisComplete(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to analyze photo"
      );
    } finally {
      setIsAnalyzing(false);
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsCapturing(true)}
        className="w-full flex items-center justify-center gap-2"
      >
        <Camera className="h-4 w-4" />
        Take Plate Photo
      </Button>

      {isAnalyzing && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Analyzing plate...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Consumption Analysis</CardTitle>
            <CardDescription>Analysis of what was eaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ConsumptionDisplay foods={analysis.foods} />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{analysis.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isCapturing && (
        <ImageCapture
          onCapture={analyzePlatePhoto}
          onClose={() => setIsCapturing(false)}
        />
      )}
    </div>
  );
}
