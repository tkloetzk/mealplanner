import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");

  if (!kidId) {
    return NextResponse.json({ error: "Kid ID is required" }, { status: 400 });
  }

  try {
    // Get today's date at midnight for consistent comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    const history = await mealHistoryCollection
      .find({
        kidId,
        date: { $gte: today }, // Get records from today onwards
      })
      .sort({ date: -1 })
      .toArray();

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    const existingRecord = await mealHistoryCollection.findOne({
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
      await mealHistoryCollection.updateOne(
        { _id: existingRecord._id },
        { $set: historyEntry }
      );
      return NextResponse.json({ ...historyEntry, _id: existingRecord._id });
    } else {
      const result = await mealHistoryCollection.insertOne(historyEntry);
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
