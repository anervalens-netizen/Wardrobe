import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Onboarding completion is not yet enabled. Unlocks in Phase 2." },
    { status: 501 },
  );
}
