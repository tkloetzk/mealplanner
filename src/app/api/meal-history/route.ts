import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/db";

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

    if (existingRecord?._id) {
      await db
        .collection("mealHistory")
        .updateOne({ _id: existingRecord._id }, { $set: historyEntry });

      return NextResponse.json({
        ...historyEntry,
        _id: existingRecord._id.toString(),
      });
    } else {
      const result = await db.collection("mealHistory").insertOne(historyEntry);

      return NextResponse.json({
        ...historyEntry,
        _id: result.insertedId.toString(),
      });
    }
  } catch (error) {
    console.error("Error saving meal history:", error);
    return NextResponse.json(
      { error: "Failed to save meal history" },
      { status: 500 }
    );
  }
}
