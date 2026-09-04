import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { evaluateAlerts } from "@/lib/alerts";
import { isEnabled } from "@/lib/features";

export async function POST() {
  if (!isEnabled("spend")) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const created = await evaluateAlerts(now.getMonth() + 1, now.getFullYear());
    return NextResponse.json({ created });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error evaluating alerts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
