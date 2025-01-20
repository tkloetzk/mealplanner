// lib/db.ts
import { MongoClient } from "mongodb";

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | undefined;
  private clientPromise: Promise<MongoClient>;

  private constructor() {
    if (process.env.NODE_ENV === "development") {
      // In development mode, use a global variable to preserve across HMR
      if (!(global as any)._mongoClientPromise) {
        this.client = new MongoClient(process.env.MONGODB_URI!);
        (global as any)._mongoClientPromise = this.client.connect();
      }
      this.clientPromise = (global as any)._mongoClientPromise;
    } else {
      // In production, create a new connection
      this.client = new MongoClient(process.env.MONGODB_URI!);
      this.clientPromise = this.client.connect();
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getClient(): Promise<MongoClient> {
    return this.clientPromise;
  }

  public async getDatabase(dbName = "mealplanner") {
    const client = await this.getClient();
    return client.db(dbName);
  }
}

export default DatabaseConnection;
