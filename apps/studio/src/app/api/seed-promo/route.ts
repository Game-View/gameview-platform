import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Seed promo endpoint working!" });
}
