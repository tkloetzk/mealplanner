import { DatabaseService } from "./DatabaseService";

export async function getCollection(collectionName: string) {
  const service = DatabaseService.getInstance();
  return await service.getCollection(collectionName);
}
