import { NextResponse } from "next/server";

export function handleError(
  error: unknown,
  message: string,
  statusCode: number = 500
) {
  console.error(message, error);
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    { error: message, details: errorMessage },
    { status: statusCode }
  );
}
