// components/BarcodeScanner.tsx
import React, { useState } from "react";
import { Result, useZxing } from "react-zxing";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Food } from "@/types/food";

interface BarcodeScannerProps {
  onScan: (upc: Food) => void;
  onClose: () => void;
}
export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const handleScan = async (result: Result) => {
    setScanning(false);

    try {
      const response = await fetch(`/api/upc?upc=${result.getText()}`);
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 404) {
          setError("Product not found in database. Try adding it manually.");
        } else {
          setError(data.error || "Failed to lookup product");
        }
        return;
      }
      const data = await response.json();
      console.log(data);
      onScan(data); // Now we're actually using the data
      onClose();
    } catch (error) {
      console.log(error);
      setError("Failed to process barcode. Please try again.");
    }
  };

  const { ref } = useZxing({
    onDecodeResult: handleScan,
    onError: (error) => {
      if (error instanceof Error) {
        // Now TypeScript knows error has a `message` property
        if (error.message.includes("NotAllowedError")) {
          setError("Camera access denied. Please enable camera permissions.");
        } else if (error.message.includes("NotFoundError")) {
          setError("No camera found. Please try on a device with a camera.");
        } else {
          setError("Error accessing camera. Please try again.");
        }
      } else {
        // Handle unexpected error types
        setError("Unexpected error occurred.");
      }
    },
    paused: !scanning || retrying,
  });

  const handleRetry = () => {
    setError("");
    setScanning(true);
    setRetrying(true);
    setTimeout(() => setRetrying(false), 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Scan Barcode</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleRetry}>
                Try Again
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <>
            <video ref={ref} className="w-full aspect-square object-cover" />
            <div className="p-4 text-sm text-gray-500 text-center">
              Position barcode within the camera view
            </div>
          </>
        )}
      </div>
    </div>
  );
}
