import { Food, MealHistoryEntry, SelectedFood } from "@/types/food";
import clientPromise from "./mongodb";

export interface MealPlan {
  userId: string;
  selections: SelectedFood[];
  updatedAt: Date;
}

export class MealService {
  // static async getUserMealPlan(userId: string) {
  //   const client = await clientPromise;
  //   const db = client.db("mealplanner");

  //   const mealPlan = await db.collection("mealPlans").findOne({ userId });
  //   return (
  //     mealPlan?.selections || {
  //       monday: {
  //         breakfast: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //         lunch: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //         dinner: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //         snack: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //       },
  //       tuesday: {
  //         breakfast: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //         lunch: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //         dinner: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //         snack: {
  //           grains: null,
  //           fruits: null,
  //           proteins: null,
  //           vegetables: null,
  //         },
  //       },
  //     }
  //   );
  // }

  // static async saveMealPlan(userId: string, selections: SelectedFood[]) {
  //   const client = await clientPromise;
  //   const db = client.db("mealplanner");

  //   await db.collection("mealPlans").updateOne(
  //     { userId },
  //     {
  //       $set: {
  //         selections,
  //         updatedAt: new Date(),
  //       },
  //     },
  //     { upsert: true }
  //   );
  // }

  // In your meal-service.ts
  static async getUserMealPlan(kidId: string) {
    const client = await clientPromise;
    const db = client.db("mealplanner");
    return await db.collection("mealPlans").findOne({ kidId });
  }

  static async saveMealPlan(kidId: string, selections: MealPlan) {
    const client = await clientPromise;
    const db = client.db("mealplanner");
    await db
      .collection("mealPlans")
      .updateOne({ kidId }, { $set: { selections } }, { upsert: true });
  }
  static async getMealHistory(userId: string) {
    const client = await clientPromise;
    const db = client.db("mealplanner");

    const history = await db
      .collection("mealHistory")
      .find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    return history;
  }

  static async getFoods(userId: string) {
    const client = await clientPromise;
    const db = client.db("mealplanner");

    const foods = await db.collection("foods").find({ userId }).toArray;
    return foods;
  }

  static async addToHistory(userId: string, mealEntry: MealHistoryEntry) {
    const client = await clientPromise;
    const db = client.db("mealplanner");

    await db.collection("mealHistory").insertOne({
      userId,
      ...mealEntry,
      createdAt: new Date(),
    });
  }

  static async getFoodDatabase() {
    const client = await clientPromise;
    const db = client.db("mealplanner");
    const foods = await db.collection("foods").find().toArray();
    return foods;
  }

  static async saveUserFood(userId: string, food: Food) {
    const client = await clientPromise;
    const db = client.db("mealplanner");
    await db.collection("foods").insertOne({
      ...food,
      userId,
      createdAt: new Date(),
    });
  }
}
