// components/FoodImageAnalysis.tsx

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageCapture } from "@/components/ImageCapture";
import { AlertTriangle, Camera } from "lucide-react";

interface FoodImageAnalysisProps {
  originalMeal: string;
  onAnalysisComplete: (analysis: {
    foods: Array<{
      name: string;
      percentageEaten: number;
      notes?: string;
    }>;
    summary: string;
  }) => void;
}

export function FoodImageConsumptionAnalysis({
  onAnalysisComplete,
  originalMeal,
}: FoodImageAnalysisProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  console.log("originalMeal", originalMeal);
  // components/FoodImageConsumptionAnalysis.tsx
  const handleImageCapture = useCallback(
    async (imageData: string) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        // Let's first log what we're sending to understand the data
        console.log("Sending image data:", {
          imageLength: imageData.length,
          imageStart: imageData.slice(0, 50), // Just log the start to verify format
        });

        const response = await fetch("/api/analyze-food-consumption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageData,
            originalMeal,
          }),
        });

        if (!response.ok) {
          // Let's get more detailed error information
          const errorData = await response.json();
          throw new Error(
            `Analysis failed: ${errorData.error || response.statusText}`
          );
        }

        const analysis = await response.json();
        onAnalysisComplete(analysis);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to analyze image"
        );
      } finally {
        setIsAnalyzing(false);
        setIsCapturing(false);
      }
    },
    [onAnalysisComplete, originalMeal]
  );
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        {!isCapturing ? (
          <Button
            onClick={() => setIsCapturing(true)}
            className="w-full h-32 flex flex-col items-center justify-center gap-2"
            variant="outline"
            disabled={isAnalyzing}
          >
            <Camera className="h-8 w-8" />
            <span>Take Plate Photo</span>
          </Button>
        ) : (
          <ImageCapture
            onCapture={handleImageCapture}
            onClose={() => setIsCapturing(false)}
          />
        )}

        {isAnalyzing && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Analyzing plate contents...</p>
          </div>
        )}
      </Card>
    </div>
  );
}
