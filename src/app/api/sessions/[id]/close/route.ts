import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Session close is not yet enabled. Unlocks in Phase 4." },
    { status: 501 },
  );
}
