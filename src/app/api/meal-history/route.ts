// src/app/api/meal-history/route.ts
import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { ensureNestedNumericFields } from "@/utils/validation/numericValidator"; // Fixed path

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");

  if (!kidId) {
    return NextResponse.json({ error: "Kid ID is required" }, { status: 400 });
  }

  try {
    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    const history = await mealHistoryCollection
      .find({ kidId })
      .sort({ date: -1 })
      .toArray();

    // Ensure all numeric fields in the history and nested objects are numbers
    const validatedHistory = history.map((entry) =>
      ensureNestedNumericFields({
        ...entry,
        date:
          entry.date instanceof Date
            ? entry.date.toISOString()
            : new Date(entry.date).toISOString(),
      })
    );

    return NextResponse.json(validatedHistory);
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

    // Create proper Date object for today
    const now = new Date();
    const date = now.toISOString();

    // Validate and transform numeric fields before saving
    const validatedMealData = ensureNestedNumericFields({
      ...mealData,
      date, // Set the date explicitly
    });

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    // Use start and end of day for filtering
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const existingRecordFilter = {
      kidId,
      date: { $gte: startOfDay, $lt: endOfDay },
      meal: validatedMealData.meal,
    };

    const updateOperation = {
      $set: {
        selections: validatedMealData.selections,
        date: date, // Ensure we set the date in the update
        timestamp: now,
      },
      $setOnInsert: {
        kidId,
        meal: validatedMealData.meal,
      },
    };

    const result = await mealHistoryCollection.findOneAndUpdate(
      existingRecordFilter,
      updateOperation,
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    await mealHistoryCollection.createIndex(
      { kidId: 1, date: 1, meal: 1 },
      { unique: true }
    );

    // Ensure numeric fields are properly converted in the response
    const validatedResult = ensureNestedNumericFields({
      ...result,
      date:
        result.date instanceof Date
          ? result.date.toISOString()
          : new Date(result.date).toISOString(),
    });

    return NextResponse.json(validatedResult);
  } catch (error) {
    console.error("Error saving meal history:", error);
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
