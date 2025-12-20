// src/app/api/meal-history/route.ts
import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { startOfDay, endOfDay } from "date-fns";
import { MealHistoryRecord, MealSelection } from "@/types/meals";
import { ObjectId, WithId } from "mongodb";

type MealHistoryRecordDb = Omit<MealHistoryRecord, "_id" | "date"> & {
  _id: ObjectId;
  date: Date;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get("kidId");
  const dateStr = searchParams.get("date");

  if (!kidId || !dateStr) {
    return NextResponse.json(
      { error: "Kid ID and date are required" },
      { status: 400 }
    );
  }

  try {
    const date = new Date(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    console.log("Fetching history for:", {
      kidId,
      date: date.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const service = DatabaseService.getInstance();
    const mealHistoryCollection =
      await service.getCollection<MealHistoryRecordDb>("mealHistory");

    const history = await mealHistoryCollection
      .find<WithId<MealHistoryRecordDb>>({
        kidId,
        date: {
          $gte: start,
          $lte: end,
        },
      })
      .toArray();

    console.log("Found history entries:", history.length);

    // Transform dates to ISO strings for consistent serialization
    const transformedHistory: MealHistoryRecord[] = history.map((entry) => ({
      _id: entry._id.toString(),
      kidId: entry.kidId,
      date: new Date(entry.date).toISOString(),
      meal: entry.meal,
      selections: entry.selections,
      consumptionData: entry.consumptionData,
    }));

    return NextResponse.json({ history: transformedHistory });
  } catch (error) {
    console.error("Error fetching meal history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch meal history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { kidId, mealData } = await request.json();
    console.log("Received meal history data:", { kidId, mealData });

    // Validate input
    if (!kidId || !mealData) {
      return NextResponse.json(
        { error: "Kid ID and meal data are required" },
        { status: 400 }
      );
    }

    if (!mealData.meal || !mealData.date || !mealData.selections) {
      return NextResponse.json(
        { error: "Meal data must include meal type, date, and selections" },
        { status: 400 }
      );
    }

    // Validate selections structure
    const selections = mealData.selections as MealSelection;
    if (!selections || typeof selections !== "object") {
      return NextResponse.json(
        { error: "Invalid selections object" },
        { status: 400 }
      );
    }

    // Ensure all required fields are present
    const requiredFields = [
      "proteins",
      "grains",
      "fruits",
      "vegetables",
      "milk",
      "ranch",
      "condiments",
    ];
    const missingFields = requiredFields.filter(
      (field) => !(field in selections)
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields in selections: ${missingFields.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const service = DatabaseService.getInstance();
    const mealHistoryCollection =
      await service.getCollection<MealHistoryRecordDb>("mealHistory");

    // Create date filter for exact day match
    const date = new Date(mealData.date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    // Create precise filter for existing entry
    const existingRecordFilter = {
      kidId,
      date: { $gte: start, $lt: end },
      meal: mealData.meal,
    };

    console.log("Saving meal history with filter:", existingRecordFilter);

    // Prepare document to save
    const mealHistoryDoc: Omit<MealHistoryRecordDb, "_id"> = {
      kidId,
      date: start,
      meal: mealData.meal,
      selections: mealData.selections,
      ...(mealData.consumptionData && {
        consumptionData: mealData.consumptionData,
      }),
    };

    console.log("Document to save:", mealHistoryDoc);

    // Update existing entry or create new one
    const result = await mealHistoryCollection.findOneAndUpdate(
      existingRecordFilter,
      { $set: mealHistoryDoc },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    console.log("Save result:", result);

    const updated =
      result && typeof result === "object" && "value" in result
        ? (result as { value: WithId<MealHistoryRecordDb> | null }).value
        : (result as WithId<MealHistoryRecordDb> | null);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to save meal history" },
        { status: 500 }
      );
    }

    const dto: MealHistoryRecord = {
      _id: updated._id.toString(),
      kidId: updated.kidId,
      date: new Date(updated.date).toISOString(),
      meal: updated.meal,
      selections: updated.selections,
      consumptionData: updated.consumptionData,
    };

    return NextResponse.json({ success: true, data: dto });
  } catch (error) {
    console.error("Error saving meal history:", error);
    return NextResponse.json(
      {
        error: "Failed to save meal history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
