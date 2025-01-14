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

  const handleImageCapture = async (imageData: string) => {
    setIsTakingPhoto(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", imageData);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { url } = await response.json();
      onUpload(url);
    } catch (error) {
      console.error("Error uploading image:", error);
      // Consider adding error state for user feedback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      {imageUrl ? (
        <div className="relative max-w-sm mx-auto">
          <div className="w-full max-h-[320px] rounded-lg overflow-hidden">
            <div className="relative pb-[75%]">
              <Image
                src={imageUrl}
                alt="Food"
                layout="fill"
                objectFit="contain"
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
