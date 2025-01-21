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
