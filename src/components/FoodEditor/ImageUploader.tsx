import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { ImageCapture } from "@/components/ImageCapture";
import Image from "next/image";

interface ImageUploaderProps {
  imageUrl?: string | null;
  onUpload: (imageUrl: string) => void;
}

export function ImageUploader({ imageUrl, onUpload }: ImageUploaderProps) {
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageCapture = async (imageData: string) => {
    setIsTakingPhoto(false);
    setLoading(true);
    setError(null);

    try {
      // Create a FormData object
      const formData = new FormData();

      // Convert base64 to Blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create a File object from the Blob
      const file = new File([blob], "captured-image.jpg", {
        type: "image/jpeg",
      });

      // Append the file to FormData
      formData.append("image", file);

      console.log("Uploading image:", file);

      // Send to upload endpoint
      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        console.error("Upload error body:", errorBody);
        throw new Error(
          `HTTP error! status: ${uploadResponse.status}, body: ${errorBody}`
        );
      }

      const responseData = await uploadResponse.json();
      console.log("Upload response data:", responseData);

      if (responseData.url) {
        onUpload(responseData.url);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {imageUrl ? (
        <div className="relative max-w-sm mx-auto">
          <div className="w-full max-h-[320px] rounded-lg overflow-hidden">
            <div className="relative pb-[75%]">
              <Image
                src={imageUrl}
                alt="Food"
                fill
                style={{ objectFit: "contain" }}
                className="absolute inset-0 bg-gray-50"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={() => setIsTakingPhoto(true)}
            disabled={loading}
          >
            <Camera className="h-4 w-4 mr-1" />
            Take New Photo
          </Button>
        </div>
      ) : (
        <div className="max-w-sm mx-auto">
          <Button
            variant="outline"
            className="w-full h-[240px] flex flex-col items-center justify-center gap-2"
            onClick={() => setIsTakingPhoto(true)}
            disabled={loading}
          >
            <Camera className="h-8 w-8" />
            Take Photo
          </Button>
        </div>
      )}

      {isTakingPhoto && (
        <ImageCapture
          onCapture={handleImageCapture}
          onCancel={() => setIsTakingPhoto(false)}
        />
      )}
    </div>
  );
}
