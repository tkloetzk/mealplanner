import clientPromise from "@/lib/mongodb";
import { Food, CategoryType } from "@/types/food";

export class FoodsService {
  static async getAllFoods(): Promise<Food[]> {
    try {
      const client = await clientPromise;
      const db = client.db("mealplanner");
      const foods = await db.collection("foods").find().toArray();
      return foods.map((food) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, ...foodWithoutId } = food;
        return foodWithoutId as Food;
      });
    } catch (error) {
      console.error("Error fetching foods:", error);
      return [];
    }
  }

  static async getFoodsByCategory(category: CategoryType): Promise<Food[]> {
    try {
      const client = await clientPromise;
      const db = client.db("mealplanner");
      const foods = await db.collection("foods").find({ category }).toArray();
      return foods.map((food) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, ...foodWithoutId } = food;
        return foodWithoutId as Food;
      });
    } catch (error) {
      console.error("Error fetching foods by category:", error);
      return [];
    }
  }

  static async addFood(food: Food): Promise<Food | null> {
    try {
      const client = await clientPromise;
      const db = client.db("mealplanner");
      await db.collection("foods").insertOne(food);
      return food;
    } catch (error) {
      console.error("Error adding food:", error);
      return null;
    }
  }
}
