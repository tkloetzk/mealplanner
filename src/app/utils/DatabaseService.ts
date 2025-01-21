// lib/DatabaseService.ts
import DatabaseConnection from "@/lib/db";
import { Collection } from "mongodb";

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

  public async getCollection<T extends Document>(
    collectionName: string
  ): Promise<Collection<T>> {
    const db = await this.connection.getDatabase();
    return db.collection<T>(collectionName);
  }
}
