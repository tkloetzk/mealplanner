// components/FoodImageAnalysis.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageCapture } from "@/components/ImageCapture";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FoodAnalysisDisplay } from "./FoodAnalysisDisplay";

interface FoodImageAnalysisProps {
  onAnalysisComplete?: (analysis: string) => void;
  className?: string;
}

export function FoodImageAnalysis({
  onAnalysisComplete,
  className,
}: FoodImageAnalysisProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    foods: {
      name: string;
      description: string;
      portionSize: string;
      visualCharacteristics: string;
      nutritionalAnalysis: string;
      suggestions: string;
      concerns: string;
    }[];
    summary: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [error, setError] = useState("");

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setIsCapturing(false);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setError("");
    setIsAnalyzing(true);
    try {
      // const prompt = `As a nutritionist, analyze this food image and provide:
      //   1. Food identification
      //   2. Approximate nutritional content
      //   3. Suggestions for making it healthier
      //   4. Any concerns for children's consumption`;

      const response = await fetch("/api/analyze-food-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          //  prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setAnalysis(data);
      onAnalysisComplete?.(data);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setError(
        "Sorry, I couldn't analyze this image right now. Please try again later."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // const handleAnalysisComplete = (analysisData: AnalysisResponse) => {
  //   setAnalysis(analysisData);
  //   setShowAnalysis(true);
  //   onAnalysisComplete?.(analysisData);
  // };
  return (
    <Card className={cn("w-full max-w-sm mx-auto", className)}>
      <ScrollArea className="max-h-[400px] h-full">
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Food Image Analysis
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCapturing(true)}
              disabled={isAnalyzing}
              className="shrink-0 h-8"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Take Photo
            </Button>
          </div>

          {capturedImage && (
            <div className="space-y-2">
              <div className="relative rounded-md bg-gray-50">
                <div className="relative h-32 sm:h-40">
                  <Image
                    src={capturedImage}
                    alt="Captured food"
                    fill
                    className="rounded-md object-contain"
                    priority
                  />
                </div>
              </div>
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                size="sm"
                className="w-full h-8"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Food"
                )}
              </Button>
            </div>
          )}

          {analysis && (
            <FoodAnalysisDisplay
              analysis={analysis}
              onClose={() => setShowAnalysis(false)}
            />
          )}
          {error && (
            <Card>
              <CardContent>
                <CardContent className="h-4 w-4" />
                <CardTitle>Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {isCapturing && (
        <ImageCapture
          onCapture={handleImageCapture}
          onClose={() => setIsCapturing(false)}
        />
      )}
    </Card>
  );
}
