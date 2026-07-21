import { NextResponse } from "next/server";
import { getCategories } from "@/lib/store";

export async function GET() {
  try {
    return NextResponse.json(getCategories());
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to load categories" }, { status: 500 });
  }
}
