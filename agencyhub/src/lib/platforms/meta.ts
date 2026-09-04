import "server-only";

const API_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

interface MetaInsightRow {
  date_start: string;
  spend: string;
  impressions: string;
  clicks: string;
}

export interface DailySpendRow {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  currency: string;
}

export async function testMetaConnection(
  accessToken: string,
  adAccountId: string
): Promise<{ ok: boolean; message: string }> {
  const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const url = `${BASE}/${actId}?fields=name,currency,account_status&access_token=${accessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    return { ok: false, message: data.error.message || "Error de API Meta" };
  }

  return {
    ok: true,
    message: `Conectado: ${data.name} (${data.currency})`,
  };
}

export async function fetchMetaDailySpend(
  accessToken: string,
  adAccountId: string,
  dateFrom: string,
  dateTo: string
): Promise<DailySpendRow[]> {
  const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const params = new URLSearchParams({
    fields: "spend,impressions,clicks",
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    time_increment: "1",
    level: "account",
    access_token: accessToken,
    limit: "100",
  });

  const url = `${BASE}/${actId}/insights?${params}`;

  const acctUrl = `${BASE}/${actId}?fields=currency&access_token=${accessToken}`;
  const acctRes = await fetch(acctUrl);
  const acctData = await acctRes.json();
  const currency: string = acctData.currency || "USD";

  const rows: DailySpendRow[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl);
    const json = await response.json();

    if (json.error) {
      throw new Error(`Meta API: ${json.error.message}`);
    }

    for (const row of (json.data || []) as MetaInsightRow[]) {
      rows.push({
        date: row.date_start,
        spend: parseFloat(row.spend) || 0,
        impressions: parseInt(row.impressions) || 0,
        clicks: parseInt(row.clicks) || 0,
        currency,
      });
    }

    nextUrl = json.paging?.next || null;
  }

  return rows;
}
