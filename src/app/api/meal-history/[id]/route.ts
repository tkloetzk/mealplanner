// app/api/meal-history/[id]/route.ts

import { DatabaseService } from "@/app/utils/DatabaseService";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { consumptionData } = await request.json();

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    await mealHistoryCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { consumptionData } }
    );

    return NextResponse.json({ message: "History updated successfully" });
  } catch (error) {
    console.error("Error updating meal history:", error);
    return NextResponse.json(
      { error: "Failed to update meal history" },
      { status: 500 }
    );
  }
}
