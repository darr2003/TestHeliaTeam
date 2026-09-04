import { NextRequest, NextResponse } from "next/server";
import { syncAllConnections, syncAllConnectionsForMonth } from "@/lib/sync";
import { evaluateAlerts } from "@/lib/alerts";
import { isEnabled } from "@/lib/features";

export const maxDuration = 120;

async function handleSync(request: NextRequest) {
  if (!isEnabled("spend")) {
    return new NextResponse(null, { status: 404 });
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const day = now.getDate();

    const results = await syncAllConnections("scheduled");

    let prevMonthResults: typeof results = [];
    if (day <= 5) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 1) { prevMonth = 12; prevYear--; }
      prevMonthResults = await syncAllConnectionsForMonth("scheduled", prevYear, prevMonth);
    }

    const alertsCreated = await evaluateAlerts(month, year);

    return NextResponse.json({
      results,
      prevMonthResults: prevMonthResults.length > 0 ? prevMonthResults : undefined,
      alertsCreated,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sync error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const GET = handleSync;
export const POST = handleSync;
