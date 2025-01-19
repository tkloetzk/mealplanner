import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/db";
import { MealService } from "@/lib/meal-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");

  if (!kidId) {
    return NextResponse.json({ error: "Kid ID is required" }, { status: 400 });
  }

  try {
    const history = await MealService.getMealHistory(kidId);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching meal history:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { kidId, mealData } = await request.json();
    const client = await clientPromise;
    const db = client.db("mealplanner");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await db.collection("mealHistory").findOne({
      kidId,
      date: today,
      meal: mealData.meal,
    });

    const historyEntry = {
      kidId,
      date: today,
      meal: mealData.meal,
      selections: mealData.selections,
    };

    if (existingRecord) {
      await db
        .collection("mealHistory")
        .updateOne({ _id: existingRecord._id }, { $set: historyEntry });
      return NextResponse.json({ ...historyEntry, _id: existingRecord._id });
    } else {
      const result = await db.collection("mealHistory").insertOne(historyEntry);
      return NextResponse.json({ ...historyEntry, _id: result.insertedId });
    }
  } catch (error) {
    console.error("Error saving meal history:", error);
    return NextResponse.json(
      { error: "Failed to save meal history" },
      { status: 500 }
    );
  }
}
