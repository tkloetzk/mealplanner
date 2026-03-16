// components/ImageUploader.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageSrc(dataUrl);
      onUpload(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  // Determine initial image source
  const initialImageSrc = food
    ? getFoodImageSource(food as Food)
    : // @ts-expect-error Idk what to do
    isValidUrl(imageUrl)
    ? imageUrl
    : null;

  // @ts-expect-error Idk what to do
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc);

  // Update image source when food or imageUrl changes
  useEffect(() => {
    const newImageSrc = food
      ? getFoodImageSource(food as Food)
      : // @ts-expect-error Idk what to do
      isValidUrl(imageUrl)
      ? imageUrl
      : null;
    // @ts-expect-error Idk what to do
    setImageSrc(newImageSrc);
  }, [food, imageUrl]);

  const handleImageCapture = (imageData: string) => {
    setImageSrc(imageData);
    onUpload(imageData);
    setIsTakingPhoto(false);
  };

  return (
    <div className="mb-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
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
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsTakingPhoto(true)}
            >
              <Camera className="h-4 w-4 mr-1" />
              Camera
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-sm mx-auto grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-[240px] flex flex-col items-center justify-center gap-2"
            onClick={() => setIsTakingPhoto(true)}
          >
            <Camera className="h-8 w-8" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[240px] flex flex-col items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8" />
            Upload Photo
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
