import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import { Food } from "@/types/food";

interface BarcodeScannerProps {
  onScan: (food: Food) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Create a new instance of the barcode reader
    const codeReader = new BrowserMultiFormatReader();
    let mounted = true;

    const startScanning = async () => {
      try {
        if (!videoRef.current) return;

        // The method accepts three parameters:
        // 1. deviceId (undefined means use default camera)
        // 2. video element
        // 3. callback function for results
        controlsRef.current = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result) => {
            if (!result || !mounted) return;

            try {
              const response = await fetch(`/api/upc?upc=${result.getText()}`);
              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Failed to fetch product data");
              }

              onScan(data);
              onClose();
            } catch (error) {
              console.error("Error fetching product data:", error);
              setError("Product not found. Please try scanning again.");
            }
          }
        );

        // Set up video constraints after initializing the scanner
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const videoTrack = stream.getVideoTracks()[0];

          // Apply constraints to the video track
          await videoTrack.applyConstraints({
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          });
        }

        setIsInitializing(false);
      } catch (error) {
        console.error("Scanner initialization error:", error);
        setError(
          "Unable to access camera. Please check your permissions and try again."
        );
        setIsInitializing(false);
      }
    };

    startScanning();

    // Cleanup function
    return () => {
      mounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
      // Release video stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Scan Barcode</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (controlsRef.current) {
                controlsRef.current.stop();
              }
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-square bg-gray-100">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline // Important for iOS
                muted // Required for autoplay
              />
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Camera className="h-8 w-8 animate-pulse" />
                </div>
              )}
            </div>
            <div className="p-4 text-sm text-gray-500 text-center">
              {isInitializing
                ? "Initializing camera..."
                : "Position barcode within the camera view"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
