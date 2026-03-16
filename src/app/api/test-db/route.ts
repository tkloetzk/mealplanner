import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";

export async function GET() {
  try {
    const testCollection = await DatabaseService.getInstance().getCollection("test");

    await testCollection.insertOne({
      test: true,
      date: new Date(),
      message: "MongoDB connection successful!",
    });

    const result = await testCollection.findOne({ test: true });

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to MongoDB!",
      timestamp: new Date(),
      testData: result,
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
