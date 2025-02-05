// src/app/api/meal-history/route.ts
import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { ensureNestedNumericFields } from "@/utils/validation/numericValidator";
import { MealHistoryRecord } from "@/types/meals";
import { WithId } from "mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");

  if (!kidId) {
    return NextResponse.json({ error: "Kid ID is required" }, { status: 400 });
  }

  try {
    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    // Get the last 30 days of history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await mealHistoryCollection
      .find<WithId<MealHistoryRecord>>({
        kidId,
        date: { $gte: thirtyDaysAgo },
      })
      .sort({ date: -1 })
      .toArray();

    // Ensure all numeric fields in the history and nested objects are numbers
    const validatedHistory = history.map((entry) => {
      // Ensure date is properly formatted
      const entryDate =
        entry.date instanceof Date ? entry.date : new Date(entry.date);

      // Validate the entry structure
      const validatedEntry = ensureNestedNumericFields({
        ...entry,
        date: entryDate.toISOString(),
        selections: entry.selections || {},
        consumptionData: entry.consumptionData || null,
      });

      // Ensure selections has all required fields
      if (!validatedEntry.selections) {
        validatedEntry.selections = {
          proteins: null,
          grains: null,
          fruits: null,
          vegetables: null,
          milk: null,
          condiments: [],
        };
      }

      return validatedEntry;
    });

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

    const service = DatabaseService.getInstance();
    const mealHistoryCollection = await service.getCollection("mealHistory");

    // Create date filter for exact day match
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Create precise filter for existing entry
    const existingRecordFilter = {
      kidId,
      date: { $gte: today, $lt: tomorrow },
      meal: mealData.meal,
    };

    // Validate and prepare meal data
    const validatedMealData = ensureNestedNumericFields({
      selections: mealData.selections || {},
      meal: mealData.meal,
      consumptionData: mealData.consumptionData || null,
    });

    // Prepare update operation
    const updateOperation = {
      $set: {
        selections: validatedMealData.selections,
        consumptionData: validatedMealData.consumptionData,
        timestamp: new Date(),
      },
      $setOnInsert: {
        date: today,
        kidId,
        meal: validatedMealData.meal,
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

    return NextResponse.json(result);
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
