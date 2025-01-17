// utils/imageUtils.ts
import { Food } from "@/types/food";

export function getFoodImageSource(food: Food): string | null {
  // Priority 1: Cloudinary URL (if exists)
  if (food.cloudinaryUrl) {
    return food.cloudinaryUrl;
  }

  // Priority 2: Local image path in public folder
  if (food.imagePath) {
    return `/images/food/${food.imagePath}`;
  }

  // Priority 3: External image URL
  if (food.imageUrl) {
    return food.imageUrl;
  }

  // No image found
  return null;
}

// Helper function to validate URL
export function isValidUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
