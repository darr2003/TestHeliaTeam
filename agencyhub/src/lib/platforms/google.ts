import "server-only";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_API_VERSION = "v18";
const ADS_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

export interface DailySpendRow {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  currency: string;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET en las variables de entorno");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`Google OAuth: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

export async function testGoogleConnection(
  accessToken: string,
  customerId: string,
  refreshToken: string | null
): Promise<{ ok: boolean; message: string }> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) {
    return { ok: false, message: "Falta GOOGLE_ADS_DEVELOPER_TOKEN en variables de entorno" };
  }

  let token = accessToken;
  if (refreshToken) {
    try {
      token = await refreshAccessToken(refreshToken);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al refrescar token";
      return { ok: false, message: msg };
    }
  }

  const cid = customerId.replace(/-/g, "");
  const query = `SELECT customer.descriptive_name, customer.currency_code FROM customer LIMIT 1`;

  const res = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": devToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  if (data.error || (Array.isArray(data) && data[0]?.error)) {
    const err = data.error || data[0]?.error;
    return { ok: false, message: err.message || "Error de Google Ads API" };
  }

  const results = Array.isArray(data) ? data[0]?.results : data.results;
  const name = results?.[0]?.customer?.descriptiveName || cid;
  const currency = results?.[0]?.customer?.currencyCode || "?";

  return { ok: true, message: `Conectado: ${name} (${currency})` };
}

export async function fetchGoogleDailySpend(
  accessToken: string,
  customerId: string,
  refreshToken: string | null,
  dateFrom: string,
  dateTo: string
): Promise<DailySpendRow[]> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) {
    throw new Error("Falta GOOGLE_ADS_DEVELOPER_TOKEN");
  }

  let token = accessToken;
  if (refreshToken) {
    token = await refreshAccessToken(refreshToken);
  }

  const cid = customerId.replace(/-/g, "");
  const from = dateFrom.replace(/-/g, "");
  const to = dateTo.replace(/-/g, "");

  const query = `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      customer.currency_code
    FROM customer
    WHERE segments.date BETWEEN '${from}' AND '${to}'
  `;

  const res = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": devToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  if (data.error || (Array.isArray(data) && data[0]?.error)) {
    const err = data.error || data[0]?.error;
    throw new Error(`Google Ads API: ${err.message}`);
  }

  const batches = Array.isArray(data) ? data : [data];
  const rows: DailySpendRow[] = [];

  for (const batch of batches) {
    for (const result of batch.results || []) {
      const seg = result.segments;
      const met = result.metrics;
      const cur = result.customer?.currencyCode || "USD";

      rows.push({
        date: seg.date,
        spend: (parseInt(met.costMicros) || 0) / 1_000_000,
        impressions: parseInt(met.impressions) || 0,
        clicks: parseInt(met.clicks) || 0,
        conversions: Math.round(parseFloat(met.conversions) || 0),
        currency: cur,
      });
    }
  }

  return rows;
}
