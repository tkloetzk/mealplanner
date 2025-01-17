// components/ImageCapture.tsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export function ImageCapture({ onCapture, onClose }: ImageCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<{
    status: "idle" | "initializing" | "ready" | "error";
    message?: string;
  }>({ status: "idle" });

  // Debug logging function
  // eslint-disable-next-line
  const logDebug = (message: string, data?: any) => {
    console.log(`[ImageCapture] ${message}`, data || "");
  };

  const startCamera = useCallback(async () => {
    // Reset status and stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCameraStatus({ status: "initializing" });
    setCapturedImage(null);
    logDebug("Starting camera initialization");

    try {
      // Check for media devices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported");
      }

      // Multiple constraint attempts
      const constraintOptions = [
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
        },
        { video: true },
      ];

      let stream: MediaStream | null = null;

      // Try different constraint sets
      for (const constraints of constraintOptions) {
        try {
          logDebug(
            "Attempting to get user media with constraints",
            constraints
          );
          stream = await navigator.mediaDevices.getUserMedia(constraints);

          if (stream) break;
        } catch (constraintError) {
          logDebug("Constraint attempt failed", constraintError);
        }
      }

      if (!stream) {
        throw new Error("Could not access camera");
      }

      // Store stream reference
      streamRef.current = stream;

      // Verify video ref exists
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      // Set stream to video element
      videoRef.current.srcObject = stream;

      // Wait for metadata and play
      await new Promise<void>((resolve, reject) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            logDebug("Metadata loaded");
            resolve();
          };
          videoRef.current.onerror = (error) => {
            logDebug("Video error", error);
            reject(error);
          };
        }
      });

      // Force play with error handling
      try {
        await videoRef.current.play();
        logDebug("Video playing successfully");
        setCameraStatus({ status: "ready" });
      } catch (playError) {
        logDebug("Play error", playError);
        setCameraStatus({
          status: "error",
          message: "Could not play video stream",
        });
      }
    } catch (err) {
      logDebug("Camera initialization error", err);
      setCameraStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  // Initialize camera on mount and provide method for retaking
  useEffect(() => {
    startCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Capture image method
  const captureImage = useCallback(() => {
    logDebug("Attempting to capture image");

    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);

        // Stop video tracks after capturing
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        logDebug("Image captured successfully");
      }
    }
  }, []);

  // Render based on camera status
  if (cameraStatus.status === "error") {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg text-center">
          <h3 className="text-lg font-bold text-red-500 mb-4">Camera Error</h3>
          <p className="mb-4">{cameraStatus.message}</p>
          <div className="flex justify-center space-x-2">
            <Button onClick={startCamera}>Retry</Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Captured image view
  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-lg w-full">
          <div className="p-4 flex justify-between items-center">
            <h3 className="font-semibold">Captured Image</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Image
            src={capturedImage}
            alt="Captured food"
            width={400}
            height={400}
            className="w-full aspect-square object-cover"
          />
          <div className="p-4 flex justify-between">
            <Button variant="outline" onClick={startCamera}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button onClick={() => onCapture(capturedImage)}>
              <Check className="h-4 w-4 mr-2" />
              Use Photo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Camera view
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Take Food Photo</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-square object-cover bg-gray-200"
          />
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex justify-center">
              <Button
                onClick={captureImage}
                disabled={cameraStatus.status !== "ready"}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        </div>
        {cameraStatus.status === "initializing" && (
          <div className="p-4 text-center text-gray-500">
            Initializing camera...
          </div>
        )}
      </div>
    </div>
  );
}
