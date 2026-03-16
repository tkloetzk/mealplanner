import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { handleError } from "@/app/utils/apiUtils";
import { FoodCache } from "@/app/utils/FoodCache";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: foodId } = await params;
  if (!foodId) return handleError(null, "Invalid food ID", 400);

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");
    const result = await foodsCollection.deleteOne({
      _id: new ObjectId(foodId),
    });

    if (result.deletedCount === 1) {
      FoodCache.getInstance().clear();
      return NextResponse.json({ message: "Food deleted successfully" });
    } else {
      return handleError(null, "Food not found or could not be deleted", 404);
    }
  } catch (error) {
    return handleError(error, "Failed to delete food");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: foodId } = await params;

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");

    const updatedFood = await request.json();

    if (!foodId) {
      return NextResponse.json({ error: "Invalid food ID" }, { status: 400 });
    }

    // Validate serving sizes structure if present
    if (updatedFood.servingSizes) {
      if (
        !Array.isArray(updatedFood.servingSizes) ||
        updatedFood.servingSizes.length === 0
      ) {
        return NextResponse.json(
          { error: "servingSizes must be a non-empty array" },
          { status: 400 }
        );
      }

      // Validate each serving size option
      for (const option of updatedFood.servingSizes) {
        if (!option.id || !option.label || option.gramsEquivalent === undefined) {
          return NextResponse.json(
            {
              error:
                "Each serving size must have id, label, and gramsEquivalent",
            },
            { status: 400 }
          );
        }

        if (option.gramsEquivalent <= 0) {
          return NextResponse.json(
            { error: "gramsEquivalent must be greater than 0" },
            { status: 400 }
          );
        }
      }

      if (!updatedFood.baseNutritionPer100g) {
        return NextResponse.json(
          {
            error: "baseNutritionPer100g is required when using servingSizes",
          },
          { status: 400 }
        );
      }
    }

    const result = await foodsCollection.updateOne(
      { _id: new ObjectId(foodId) },
      { $set: updatedFood }
    );

    if (result.modifiedCount === 1) {
      FoodCache.getInstance().clear();
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: foodId } = await params;

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

    FoodCache.getInstance().clear();
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
