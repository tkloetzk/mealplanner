// components/ImageUploader.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { ImageCapture } from "@/components/ImageCapture";
import Image from "next/image";
import { getFoodImageSource, isValidUrl } from "@/utils/imageUtils";
import { Food } from "@/types/food";

interface ImageUploaderProps {
  food?: Partial<Food>;
  imageUrl?: string | null;
  onUpload: (imageData: string) => void;
}

export const ImageUploader = ({
  food,
  imageUrl,
  onUpload,
}: ImageUploaderProps) => {
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // Determine initial image source
  const initialImageSrc = food
    ? getFoodImageSource(food as Food)
    : isValidUrl(imageUrl)
    ? imageUrl
    : null;

  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc);

  // Update image source when food or imageUrl changes
  useEffect(() => {
    const newImageSrc = food
      ? getFoodImageSource(food as Food)
      : isValidUrl(imageUrl)
      ? imageUrl
      : null;

    setImageSrc(newImageSrc);
  }, [food, imageUrl]);

  const handleImageCapture = (imageData: string) => {
    setImageSrc(imageData);
    onUpload(imageData);
    setIsTakingPhoto(false);
  };

  return (
    <div className="mb-4">
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
          >
            <Camera className="h-8 w-8" />
            Take Photo
          </Button>
        </div>
      )}

      {isTakingPhoto && (
        <ImageCapture
          onCapture={handleImageCapture}
          onClose={() => setIsTakingPhoto(false)}
        />
      )}
    </div>
  );
};
