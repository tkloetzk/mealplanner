import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getCollection } from "@/app/utils/databaseUtils";
import { normalizeFoodData } from "@/utils/foodMigration";
import { FoodCache } from "@/app/utils/FoodCache";
import type { Food } from "@/types/food";
import type { ObjectId } from "mongodb";

type FoodDocument = Omit<Food, "id"> & { _id: ObjectId };

async function isAuthorized(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return false;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const foodsCollection = await getCollection<FoodDocument>("foods");
    const foods = await foodsCollection.find({}).toArray();

    let migratedCount = 0;
    let alreadyNormalizedCount = 0;

    for (const food of foods) {
      const { _id, ...foodWithoutId } = food;
      const foodObj: Food = { ...foodWithoutId, id: _id.toString() };

      if (foodObj.servingSizes && foodObj.baseNutritionPer100g) {
        alreadyNormalizedCount++;
        continue;
      }

      const normalized = normalizeFoodData(foodObj);

      await foodsCollection.updateOne(
        { _id },
        {
          $set: {
            servingSizes: normalized.servingSizes,
            baseNutritionPer100g: normalized.baseNutritionPer100g,
          },
        }
      );
      migratedCount++;
    }

    FoodCache.getInstance().clear();

    return NextResponse.json({
      ok: true,
      total: foods.length,
      migrated: migratedCount,
      alreadyNormalized: alreadyNormalizedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Migration failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
