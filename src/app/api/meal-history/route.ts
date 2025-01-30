import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");

  if (!kidId) {
    return NextResponse.json({ error: "Kid ID is required" }, { status: 400 });
  }

  try {
    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    // Fetch meal history for the specific kid, sorted by date (most recent first)
    const history = await mealHistoryCollection
      .find({ kidId })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching meal history:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch meal history",
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { kidId, mealData } = await request.json();

    // Validate input
    if (!kidId) {
      return NextResponse.json(
        { error: "Kid ID is required" },
        { status: 400 }
      );
    }
    if (!mealData) {
      return NextResponse.json(
        { error: "Meal data is required" },
        { status: 400 }
      );
    }

    // Reset time to start of day for consistent comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    // Combine day, meal type, and kidId for unique identification
    const existingRecordFilter = {
      kidId,
      date: { $gte: today },
      meal: mealData.meal,
    };

    // Prepare history entry with full data
    const historyEntry = {
      kidId,
      date: today,
      meal: mealData.meal,
      selections: mealData.selections,
      timestamp: new Date(),
    };

    // Update or insert record
    const result = await mealHistoryCollection.findOneAndUpdate(
      existingRecordFilter,
      { $set: historyEntry },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    // Return the saved/updated document
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving meal history:", error);

    // Detailed error logging
    return NextResponse.json(
      {
        error: "Failed to save meal history",
        details:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              }
            : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
