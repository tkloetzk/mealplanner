import { NextResponse } from "next/server";
import { cloudinaryConfig } from "@/services/infrastructure/storage/cloudinary/cloudinaryService";

export async function POST(request: Request) {
  try {
    // Parse the incoming form data
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${image.type};base64,${buffer.toString(
      "base64"
    )}`;

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinaryConfig.uploader.upload(
        base64Image,
        {
          folder: "meal-planner", // Optional: organize uploads in a folder
          overwrite: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Return the secure URL of the uploaded image
    return NextResponse.json({
      url: (uploadResponse as { secure_url: string }).secure_url,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
