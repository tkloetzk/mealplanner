import { MongoClient } from "mongodb";

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | undefined;
  private clientPromise: Promise<MongoClient>;
  private databaseName: string;

  private constructor() {
    const env = process.env.NODE_ENV || "development";
    this.databaseName =
      env === "production" ? "mealplanner" : "mealplanner_dev";

    if (!process.env.MONGODB_URI) {
      throw new Error("Please add your Mongo URI to .env.local");
    }

    if (env === "development") {
      const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
      };

      if (!globalWithMongo._mongoClientPromise) {
        this.client = new MongoClient(process.env.MONGODB_URI);
        globalWithMongo._mongoClientPromise = this.client.connect();
      }
      this.clientPromise = globalWithMongo._mongoClientPromise;
    } else {
      this.client = new MongoClient(process.env.MONGODB_URI);
      this.clientPromise = this.client.connect();
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getClient(): Promise<MongoClient> {
    return this.clientPromise;
  }

  public async getDatabase(customDbName?: string) {
    const client = await this.getClient();
    return client.db(customDbName || this.databaseName);
  }
}

export default DatabaseConnection;
