import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { DatabaseService } from "@/app/utils/DatabaseService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: NextRequest, props: Props) {
  const { id: foodId } = await props.params;

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");

    const result = await foodsCollection.deleteOne({
      _id: new ObjectId(foodId),
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
export const PUT = async (request: NextRequest, props: Props) => {
  const { id: foodId } = await props.params;

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");

    const updatedFood = await request.json();

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
};
export async function PATCH(request: NextRequest, props: Props) {
  const { id: foodId } = await props.params;

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");

    const updateData = await request.json();

    if (!foodId) {
      return NextResponse.json(
        { error: "Food ID is required" },
        { status: 400 }
      );
    }

    const result = await foodsCollection.updateOne(
      { _id: new ObjectId(foodId) },
      {
        $set: {
          hiddenFromChild: updateData.hiddenFromChild,
        },
      },
      { upsert: false }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Food visibility updated successfully",
      hiddenFromChild: updateData.hiddenFromChild,
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
