import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { ensureNestedNumericFields } from "@/utils/validation/numericValidator";

export async function POST(request: Request) {
  try {
    const { kidId, day, meal, selections } = await request.json();

    // Validate input
    if (!kidId || !day || !meal || !selections) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const service = DatabaseService.getInstance();
    const mealSelectionsCollection = await service.getCollection(
      "mealSelections"
    );

    // Create filter for exact match
    const filter = {
      kidId,
      day,
      meal,
    };

    // Prepare update operation with validated data
    const validatedSelections = ensureNestedNumericFields(selections);
    const updateOperation = {
      $set: {
        selections: validatedSelections,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        kidId,
        day,
        meal,
        createdAt: new Date(),
      },
    };

    // Update or create document
    const result = await mealSelectionsCollection.findOneAndUpdate(
      filter,
      updateOperation,
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    // Create index to support the query
    await mealSelectionsCollection.createIndex(
      { kidId: 1, day: 1, meal: 1 },
      { unique: true }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving meal selections:", error);
    return NextResponse.json(
      {
        error: "Failed to save meal selections",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");
  const day = searchParams.get("day");

  if (!kidId || !day) {
    return NextResponse.json(
      { error: "kidId and day are required" },
      { status: 400 }
    );
  }

  try {
    const service = DatabaseService.getInstance();
    const mealSelectionsCollection = await service.getCollection(
      "mealSelections"
    );

    const selections = await mealSelectionsCollection
      .find({ kidId, day })
      .toArray();

    return NextResponse.json(selections);
  } catch (error) {
    console.error("Error fetching meal selections:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch meal selections",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
