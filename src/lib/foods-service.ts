import clientPromise from "@/lib/mongodb";
import { Food, CategoryType } from "@/types/food";

export class FoodsService {
  static async getAllFoods() {
    try {
      const client = await clientPromise;
      const db = client.db("mealplanner");
      return await db.collection("foods").find().toArray();
    } catch (error) {
      console.error("Error fetching foods:", error);
      return [];
    }
  }

  static async getFoodsByCategory(category: CategoryType) {
    try {
      const client = await clientPromise;
      const db = client.db("mealplanner");
      return await db.collection("foods").find({ category }).toArray();
    } catch (error) {
      console.error("Error fetching foods by category:", error);
      return [];
    }
  }

  static async addFood(food: Food) {
    try {
      const client = await clientPromise;
      const db = client.db("mealplanner");
      const result = await db.collection("foods").insertOne(food);
      return { ...food, _id: result.insertedId };
    } catch (error) {
      console.error("Error adding food:", error);
      return null;
    }
  }
}
