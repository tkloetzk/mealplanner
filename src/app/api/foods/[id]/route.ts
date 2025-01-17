// app/api/foods/[id]/route.ts
import { NextResponse } from "next/server";
import { FoodsService } from "@/lib/foods-service";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const foodId = params.id;

    const result = await FoodsService.deleteFood(foodId);

    if (result) {
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
