import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { ImageCapture } from "@/components/ImageCapture";
import Image from "next/image";
import { getFoodImageSource } from "@/utils/imageUtils";
import { Food } from "@/types/food";

interface ImageUploaderProps {
  food?: Partial<Food>;
  imageUrl?: string | null;
  onUpload: (updatedFood: Partial<Food>) => void;
}

export function ImageUploader({
  food,
  imageUrl,
  onUpload,
}: ImageUploaderProps) {
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageCapture = async (imageData: string) => {
    try {
      const formData = new FormData();
      const response = await fetch(imageData);

      if (!response.ok) {
        throw new Error(`Image fetch failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], "captured-image.jpg", {
        type: "image/jpeg",
      });

      formData.append("image", file);

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const { url } = await uploadResponse.json();

      onUpload({ cloudinaryUrl: url });
    } catch (error) {
      console.error("Image upload error:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Determine the image source using the utility function
  const imageSrc = food ? getFoodImageSource(food as Food) : imageUrl;

  return (
    <div className="mb-4">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {imageSrc ? (
        <div className="relative max-w-sm mx-auto">
          <div className="w-full max-h-[320px] rounded-lg overflow-hidden">
            <div className="relative pb-[75%]">
              <Image
                src={imageSrc}
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
