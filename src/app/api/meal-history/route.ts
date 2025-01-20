import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
// In your API route response
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kidId = searchParams.get("kidId");

    if (!kidId) {
      return NextResponse.json(
        { error: "Kid ID is required" },
        { status: 400 }
      );
    }

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    const history = await mealHistoryCollection
      .find({ kidId })
      .sort({ date: -1 })
      .limit(50)
      .toArray();

    // Transform MongoDB's _id to string
    const formattedHistory = history.map((entry) => ({
      ...entry,
      _id: entry._id.toString(), // Convert ObjectId to string
    }));

    return NextResponse.json(formattedHistory);
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
