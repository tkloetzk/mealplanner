// src/services/food/foodService.ts
import type { Food, CategoryType } from "@/types/food";

export class FoodsService {
  async getAllFoods(): Promise<Food[]> {
    try {
      const response = await fetch("/api/foods");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching foods:", error);
      return [];
    }
  }

  async getFoodsByCategory(category: CategoryType): Promise<Food[]> {
    try {
      const response = await fetch(`/api/foods?category=${category}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching foods by category:", error);
      return [];
    }
  }

  async addFood(food: Food): Promise<Food | null> {
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      return await response.json();
    } catch (error) {
      console.error("Error adding food:", error);
      return null;
    }
  }
  async deleteFood(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/foods/${id}`, { method: "DELETE" });
      if (response.ok) {
        return true;
      } else {
        console.error("Error deleting food:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Error deleting food:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const foodService = new FoodsService();
