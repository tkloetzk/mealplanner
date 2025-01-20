import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageCapture } from "@/components/ImageCapture";
import { Card } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface FoodImageAnalysisProps {
  onAnalysisComplete?: (analysis: string) => void;
}

export function FoodImageAnalysis({
  onAnalysisComplete,
}: FoodImageAnalysisProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setIsCapturing(false);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      const prompt = `As a nutritionist, analyze this food image and provide:
        1. Food identification
        2. Approximate nutritional content
        3. Suggestions for making it healthier
        4. Any concerns for children's consumption`;

      const response = await fetch("/api/analyze-food-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setAnalysis(data.output);
      onAnalysisComplete?.(data.output);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysis(
        "Sorry, I couldn't analyze this image right now. Please try again later."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Food Image Analysis</h3>
          <Button
            variant="outline"
            onClick={() => setIsCapturing(true)}
            disabled={isAnalyzing}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-video">
              <Image
                src={capturedImage}
                alt="Captured food"
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <Button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Analyze Food"
              )}
            </Button>
          </div>
        )}

        {analysis && (
          <div className="prose prose-sm max-w-none mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="whitespace-pre-wrap">{analysis}</div>
          </div>
        )}

        {isCapturing && (
          <ImageCapture
            onCapture={handleImageCapture}
            onClose={() => setIsCapturing(false)}
          />
        )}
      </div>
    </Card>
  );
}
