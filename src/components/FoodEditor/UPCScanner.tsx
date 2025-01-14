import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Food } from "@/types/food";

interface UPCScannerProps {
  onUPCFound: (food: Food) => void;
  onManualEntry: (upc: string) => void;
}

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
      onUPCFound(data);
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
