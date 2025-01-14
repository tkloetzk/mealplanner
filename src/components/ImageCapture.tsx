// components/ImageCapture.tsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export function ImageCapture({ onCapture, onCancel }: ImageCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const initializeCamera = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for metadata and play
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        await videoRef.current.play();
      }

      setError("");
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to access camera. Please check permissions.");
      setIsLoading(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageData);

        // Stop video tracks, but keep stream reference
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    initializeCamera();
  }, [initializeCamera]);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // Initial camera setup
  useEffect(() => {
    initializeCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initializeCamera]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Take Food Photo</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : capturedImage ? (
          <div className="relative">
            <Image
              src={capturedImage}
              alt="Captured food"
              width={400}
              height={400}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleRetry}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={handleConfirm}>
                  <Check className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex justify-center">
                <Button onClick={captureImage}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
