import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "@/components/features/food/FoodEditor/components/BarcodeScanner/BarcodeScanner";
import { Food } from "@/types/food";

interface UPCScannerProps {
  onUPCFound: (food: Food) => void;
  onManualEntry: (upc: string) => void;
}

// Parse E-numbers from ingredients text
const extractAdditives = (ingredients: string): string[] => {
  const eNumberRegex = /E\d{3,4}[a-z]?/g;
  return ingredients?.match(eNumberRegex) || [];
};

export function UPCScanner({ onUPCFound, onManualEntry }: UPCScannerProps) {
  const [manualUPC, setManualUPC] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualUPCEntry = async () => {
    setIsSubmitting(true);
    try {
      onManualEntry(manualUPC);
      const response = await fetch(
        `/api/upc?upc=${encodeURIComponent(manualUPC)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const additives =
        data.additives.length > 0
          ? data.additives
          : extractAdditives(data.ingredients);

      console.log(data.ingredients);

      const ingText = `The food is made out of ${data.ingredientText?.join(
        ", "
      )}.`;

      const arg = data.ecoscoreGrade
        ? `The agribalyse ecoscore grade is ${data.ecoscoreGrade} and agribalyse ecoscore score is ${data.ecoscoreScore}`
        : "";

      // const trans = data.nutriments["trans-fat_serving"]
      //   ? ` and ${data.nutriments["trans-fat_serving"]}g of trans fat,`
      //   : "";
      // const poly = data.nutriments["polyunsaturated-fat_serving"]
      //   ? `and ${data.nutriments["polyunsaturated-fat_serving"]}g of polyunsaturated fat.`
      //   : "";
      // const additives = data.additives_tags
      //   ? `The additives are ${data.additives_tags}.`
      //   : "";

      const prompt = `The food in question is ${data.name} with ${
        data.calories
      } calories and ${data.protein}g of protein and ${
        data.carbs
      }g of carbs and ${data.sodium}g of sodium and ${
        data.saturatedFat
      }g of saturated fat and ${data.sugars}g of sugars and ${
        data.fiber
      }g of fiber, and ${data.transFat}g of trans fat, and ${
        data.polyUnsaturatedFat
      }g of polyunsaturated fat. ${ingText} ${
        additives.length > 0
          ? "The food has these additives: " + additives?.join(", ")
          : "There are no additives"
      }. ${arg}. A score out of 100, 100 being super healthy, what score would you give this? Respond in a structured JSON format. with properties of summary, positives, negatives, overall, score`;

      // Calculate Yuka score
      // const yukaScore = calculateYukaScoreFromFood({
      //   ...data,
      //   additives,
      //   saturatedFat: data.saturatedFat,
      //   sugars: data.sugars,
      //   sodium: data.sodium,
      //   fiber: data.fiber,
      //   isOrganic: data.isOrganic,
      // });

      // console.log(yukaScore);

      const scoreResp = await fetch(`/api/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!scoreResp.ok) {
        // Let's get more detailed error information
        const errorData = await scoreResp.json();
        throw new Error(
          `Analysis failed: ${errorData.error || scoreResp.statusText}`
        );
      }

      const analysis = await scoreResp.json();
      console.log("food", { ...data, analysis });
      onUPCFound({ ...data, analysis });
      setManualUPC("");
    } catch (error) {
      console.error("Error fetching product data:", error);
      // Potential: add error state to show user-friendly message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 items-center mb-4">
        <Input
          type="text"
          value={manualUPC}
          placeholder="Enter UPC code"
          onChange={(e) => setManualUPC(e.target.value)}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleManualUPCEntry}
          disabled={!manualUPC || isSubmitting}
        >
          Search
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsScanning(true)}
          disabled={isSubmitting}
        >
          Scan
        </Button>
      </div>

      {isScanning && (
        <BarcodeScanner
          onScan={(scannedFood: Food) => onUPCFound(scannedFood)}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  );
}
