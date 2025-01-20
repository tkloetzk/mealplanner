// lib/DatabaseService.ts
import DatabaseConnection from "@/lib/db";
import { ObjectId } from "mongodb";

export class DatabaseService {
  private static instance: DatabaseService;
  private connection: DatabaseConnection;

  private constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async getCollection<T extends Document>(collectionName: string) {
    const db = await this.connection.getDatabase();
    return db.collection<T>(collectionName);
  }

  // Example method for finding by ID
  public async findById<T extends Document>(
    collectionName: string,
    id: string
  ): Promise<T | null> {
    const collection = await this.getCollection<T>(collectionName);
    return collection.findOne({ _id: new ObjectId(id) });
  }
}
