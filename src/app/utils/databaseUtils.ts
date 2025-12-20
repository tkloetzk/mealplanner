import { DatabaseService } from "./DatabaseService";
import type { Document } from "mongodb";

export async function getCollection<T extends Document>(
  collectionName: string
) {
  const service = DatabaseService.getInstance();
  return await service.getCollection<T>(collectionName);
}
