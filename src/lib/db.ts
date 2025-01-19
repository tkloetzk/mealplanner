// lib/db.ts
import { MongoClient, ObjectId } from "mongodb";
import type { MealHistoryRecord, MealSelection, MealType } from "@/types/food";

// Only initialize MongoDB client on the server side
let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so the value
  // is preserved across module reloads caused by HMR
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI!);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(process.env.MONGODB_URI!);
  clientPromise = client.connect();
}

export { clientPromise };
