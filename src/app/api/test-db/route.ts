import { NextResponse } from "next/server";
import clientPromise from "@/services/infrastructure/database/mongodb/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("mealplanner");

    // Test database connection with a ping
    await db.command({ ping: 1 });

    // Try to create a test document
    const testCollection = db.collection("test");
    await testCollection.insertOne({
      test: true,
      date: new Date(),
      message: "MongoDB connection successful!",
    });

    // Retrieve the test document
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
