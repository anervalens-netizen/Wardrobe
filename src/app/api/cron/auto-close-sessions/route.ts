import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Auto-close cron is not yet enabled. Unlocks in Phase 4." },
    { status: 501 },
  );
}
