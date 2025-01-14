import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Camera } from "lucide-react";
import { Food } from "@/types/food";

interface BarcodeScannerProps {
  onScan: (food: Food) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const initializeScanner = async () => {
    try {
      if (!mountedRef.current) return;
      setIsInitializing(true);
      setError("");

      // Stop any existing stream
      stopStream();

      // Check if BarcodeDetector is supported
      if (!("BarcodeDetector" in window)) {
        throw new Error("Barcode scanning is not supported in this browser");
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be loadedmetadata before playing
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return;
          videoRef.current.onloadedmetadata = () => resolve();
        });

        if (!mountedRef.current) {
          stopStream();
          return;
        }

        await videoRef.current.play();

        // Create barcode detector
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
        });

        // Start scanning loop
        const scanLoop = async () => {
          if (!videoRef.current || !mountedRef.current) return;

          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);

            if (barcodes.length > 0 && mountedRef.current) {
              const barcode = barcodes[0];
              const response = await fetch(`/api/upc?upc=${barcode.rawValue}`);
              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Failed to fetch product data");
              }

              if (mountedRef.current) {
                onScan(data);
                onClose();
              }
            } else if (mountedRef.current) {
              requestAnimationFrame(scanLoop);
            }
          } catch (error) {
            if (mountedRef.current) {
              console.error("Scanning error:", error);
              requestAnimationFrame(scanLoop);
            }
          }
        };

        if (mountedRef.current) {
          scanLoop();
          setIsInitializing(false);
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;

      if (error instanceof Error) {
        switch (error.name) {
          case "NotAllowedError":
            setError("Camera access denied. Please enable camera permissions.");
            break;
          case "NotFoundError":
            setError("No camera found. Please try on a device with a camera.");
            break;
          default:
            setError(error.message || "Failed to initialize camera");
        }
      }
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    initializeScanner();

    return () => {
      mountedRef.current = false;
      stopStream();
    };
  }, []);

  const handleRetry = () => {
    initializeScanner();
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Scan Barcode</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={isInitializing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isInitializing ? "animate-spin" : ""
                  }`}
                />
                Try Again
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-square bg-gray-100">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
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
