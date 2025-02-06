import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { startOfDay, endOfDay } from "date-fns";
import { MealHistoryRecord, MealSelection } from "@/types/meals";
import { WithId } from "mongodb";

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
    const mealHistoryCollection = await service.getCollection("mealHistory");

    const history = await mealHistoryCollection
      .find<WithId<MealHistoryRecord>>({
        kidId,
        date: {
          $gte: start,
          $lte: end,
        },
      })
      .toArray();

    console.log("Raw history entries:", JSON.stringify(history, null, 2));

    // Transform and validate each history entry
    const transformedHistory = history.map((entry) => {
      console.log("Processing entry:", JSON.stringify(entry, null, 2));

      // Ensure selections has all required fields
      const selections: MealSelection = {
        proteins: entry.selections?.proteins || null,
        grains: entry.selections?.grains || null,
        fruits: entry.selections?.fruits || null,
        vegetables: entry.selections?.vegetables || null,
        milk: entry.selections?.milk || null,
        ranch: entry.selections?.ranch || null,
        condiments: Array.isArray(entry.selections?.condiments)
          ? entry.selections.condiments
          : [],
      };

      const transformedEntry = {
        ...entry,
        date: new Date(entry.date).toISOString(),
        _id: entry._id.toString(),
        selections,
      };

      console.log(
        "Transformed entry:",
        JSON.stringify(transformedEntry, null, 2)
      );
      return transformedEntry;
    });

    console.log(
      "Final transformed history:",
      JSON.stringify(transformedHistory, null, 2)
    );

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
