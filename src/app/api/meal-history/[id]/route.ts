// app/api/meal-history/[id]/route.ts

import { DatabaseService } from "@/app/utils/DatabaseService";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { consumptionData } = await request.json();

    // Validate consumptionData structure
    if (!consumptionData) {
      return NextResponse.json(
        { error: "Consumption data is required" },
        { status: 400 }
      );
    }

    // Validate overall status if provided
    if (consumptionData.overallStatus) {
      const validOverallStatuses = ['offered', 'partially_eaten', 'eaten'];
      if (!validOverallStatuses.includes(consumptionData.overallStatus)) {
        return NextResponse.json(
          { error: "Invalid overall consumption status" },
          { status: 400 }
        );
      }
    }

    // Validate per-food data if provided
    if (consumptionData.foods && Array.isArray(consumptionData.foods)) {
      for (const food of consumptionData.foods) {
        if (!food.foodId) {
          return NextResponse.json(
            { error: "Each food item must have a foodId" },
            { status: 400 }
          );
        }

        const validFoodStatuses = ['not_eaten', 'partially_eaten', 'eaten'];
        if (!validFoodStatuses.includes(food.status)) {
          return NextResponse.json(
            { error: "Invalid food consumption status" },
            { status: 400 }
          );
        }

        if (food.status === 'partially_eaten' && (food.percentageEaten === undefined || food.percentageEaten < 0 || food.percentageEaten > 100)) {
          return NextResponse.json(
            { error: "Percentage eaten must be between 0 and 100 for partially eaten foods" },
            { status: 400 }
          );
        }
      }
    }

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    const result = await mealHistoryCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { consumptionData } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Meal history record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "History updated successfully", matchedCount: result.matchedCount });
  } catch (error) {
    console.error("Error updating meal history:", error);
    return NextResponse.json(
      { error: "Failed to update meal history" },
      { status: 500 }
    );
  }
}
