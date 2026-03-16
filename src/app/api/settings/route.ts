import { NextResponse } from "next/server";
import { getCollection } from "@/app/utils/databaseUtils";
import { handleError } from "@/app/utils/apiUtils";

const FAMILY_ID = "default";

export async function GET() {
  try {
    const collection = await getCollection("settings");
    const doc = await collection.findOne({ familyId: FAMILY_ID });
    if (!doc) {
      return NextResponse.json(null);
    }
    const { _id, ...settings } = doc;
    return NextResponse.json(settings);
  } catch (error) {
    return handleError(error, "Failed to fetch settings");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Strip any client-sent meta fields before saving
    const { familyId: _f, updatedAt: _u, _id: _id2, ...settingsData } = body;
    const collection = await getCollection("settings");
    await collection.updateOne(
      { familyId: FAMILY_ID },
      { $set: { ...settingsData, familyId: FAMILY_ID, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error, "Failed to save settings");
  }
}
