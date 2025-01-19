import {
  Food,
  MealHistoryEntry,
  MealHistoryRecord,
  MealSelection,
  MealType,
  SelectedFood,
} from "@/types/food";
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

  static async getFoods(userId: string) {
    const client = await clientPromise;
    const db = client.db("mealplanner");

    const foods = await db.collection("foods").find({ userId }).toArray;
    return foods;
  }

  // static async addToHistory(userId: string, mealEntry: MealHistoryEntry) {
  //   const client = await clientPromise;
  //   const db = client.db("mealplanner");

  //   await db.collection("mealHistory").insertOne({
  //     userId,
  //     ...mealEntry,
  //     createdAt: new Date(),
  //   });
  // }

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
  // private static formatDate(date: Date): string {
  //   return date.toISOString().split('T')[0];  // Returns YYYY-MM-DD
  // }

  // static async upsertMealHistory(
  //   kidId: string,
  //   date: Date,
  //   meal: MealType,
  //   selections: MealSelection
  // ) {
  //   const client = await clientPromise;
  //   const db = client.db("mealplanner");

  //   const formattedDate = this.formatDate(date);

  //   // Create the history entry
  //   const historyEntry: Partial<MealHistoryRecord> = {
  //     kidId,
  //     date: formattedDate,
  //     meal,
  //     selections,
  //     updatedAt: new Date()
  //   };

  //   // Use updateOne with upsert: true to either update existing or insert new
  //   const result = await db.collection("mealHistory").updateOne(
  //     {
  //       kidId,
  //       date: formattedDate,
  //       meal
  //     },
  //     {
  //       $set: historyEntry
  //     },
  //     {
  //       upsert: true
  //     }
  //   );

  //   return { ...historyEntry, isNew: result.upsertedCount > 0 };
  // }

  // static async getMealHistory(kidId: string, startDate?: Date, endDate?: Date) {
  //   const client = await clientPromise;
  //   const db = client.db("mealplanner");

  //   const query: any = { kidId };

  //   // Add date range to query if provided
  //   if (startDate || endDate) {
  //     query.date = {};
  //     if (startDate) {
  //       query.date.$gte = this.formatDate(startDate);
  //     }
  //     if (endDate) {
  //       query.date.$lte = this.formatDate(endDate);
  //     }
  //   }

  //   return await db.collection("mealHistory")
  //     .find(query)
  //     .sort({ date: -1, meal: 1 })  // Sort by date descending and meal type
  //     .toArray();
  // }

  // static async getMealHistoryForDate(kidId: string, date: Date) {
  //   const client = await clientPromise;
  //   const db = client.db("mealplanner");

  //   const formattedDate = this.formatDate(date);

  //   return await db.collection("mealHistory")
  //     .find({
  //       kidId,
  //       date: formattedDate
  //     })
  //     .sort({ meal: 1 })  // Sort by meal type
  //     .toArray();
  // }
}
