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

    // Create date filter for exact day match
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    // Create precise filter for existing entry
    const existingRecordFilter = {
      kidId,
      date: { $gte: today, $lt: tomorrow }, // Exact day match
      meal: mealData.meal,
    };

    // Prepare update operation
    const updateOperation = {
      $set: {
        selections: mealData.selections,
        timestamp: new Date(),
      },
      $setOnInsert: {
        // Only set these fields on insert
        date: today,
        kidId,
        meal: mealData.meal,
      },
    };

    // Update existing entry or create new one
    const result = await mealHistoryCollection.findOneAndUpdate(
      existingRecordFilter,
      updateOperation,
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    // Create index to support the query
    await mealHistoryCollection.createIndex(
      { kidId: 1, date: 1, meal: 1 },
      { unique: true }
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
