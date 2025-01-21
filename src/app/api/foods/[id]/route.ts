// app/api/foods/[id]/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { DatabaseService } from "@/app/utils/DatabaseService";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const foodId = searchParams.get("id");
  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");

    const result = await foodsCollection.deleteOne({
      _id: new ObjectId(foodId?.toString()),
    });
    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Food deleted successfully" });
    } else {
      return NextResponse.json(
        { error: "Food not found or could not be deleted" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting food:", error);
    return NextResponse.json(
      { error: "Failed to delete food" },
      { status: 500 }
    );
  }
}
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const foodId = searchParams.get("id");

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");
    const updatedFood = await request.json(); // Get updated food data from request body
    if (!foodId) {
      return NextResponse.json({ error: "Invalid food ID" }, { status: 400 });
    }
    const result = await foodsCollection.updateOne(
      { _id: new ObjectId(foodId) },
      { $set: updatedFood }
    );
    if (result.modifiedCount === 1) {
      return NextResponse.json({ message: "Food updated successfully" });
    } else {
      return NextResponse.json(
        { error: "Food not found or could not be updated" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error updating food:", error);
    return NextResponse.json(
      { error: "Failed to update food" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Log the incoming request details for debugging
  console.log("PATCH request received:", {
    params,
    url: request.url,
  });

  const { id } = params;

  if (!id) {
    console.error("Missing foodId in route params");
    return NextResponse.json({ error: "Food ID is required" }, { status: 400 });
  }

  try {
    const updateData = await request.json();
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");

    // First, let's check the current state of the document
    const currentFood = await foodsCollection.findOne({
      _id: new ObjectId(id),
    });

    console.log("Current food state:", currentFood);

    // Perform the update with explicit setting of hiddenFromChild
    const result = await foodsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          hiddenFromChild: updateData.hiddenFromChild,
        },
      },
      { upsert: false } // Don't create a new document if it doesn't exist
    );

    // Verify the update
    const updatedFood = await foodsCollection.findOne({
      _id: new ObjectId(id),
    });

    console.log("Food after update:", updatedFood);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Food visibility updated successfully",
      hiddenFromChild: updateData.hiddenFromChild,
      // id: IDBObjectStore,
    });
  } catch (error) {
    console.error("Error in PATCH handler:", error);
    return NextResponse.json(
      {
        error: "Failed to update food visibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
