// AgencyHub — demo data
// Cuentas realistas (no los placeholders del seed). Abril 2026.

const fmtCLP = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtUSD = (n) => "US$" + Math.round(n).toLocaleString("en-US");
const fmtMoney = (n, cur) => cur === "USD" ? fmtUSD(n) : fmtCLP(n);
const fmtPct = (n) => (n * 100).toFixed(1) + "%";

// Today: 22 abril 2026 (día 22 de 30)
const TODAY_DAY = 22;
const DAYS_IN_MONTH = 30;

const ACCOUNTS = [
  {
    id: "chc",
    name: "CHC",
    fullName: "Clínica CHC",
    color: "#E8553A",
    currency: "CLP",
    channels: [
      { platform: "meta_ads",   planned: 1500000, spent: 1425000, lastSync: "hace 2 h",  status: "warn" },
      { platform: "google_ads", planned: 2000000, spent: 1780000, lastSync: "hace 2 h",  status: "ok" },
    ],
    alerts: 2,
  },
  {
    id: "link-uss",
    name: "LINK USS",
    fullName: "Universidad San Sebastián — LINK",
    color: "#3A7BE8",
    currency: "CLP",
    channels: [
      { platform: "meta_ads",   planned:  900000, spent:  812000, lastSync: "hace 2 h", status: "ok" },
      { platform: "google_ads", planned: 1100000, spent: 1147000, lastSync: "hace 2 h", status: "crit" },
    ],
    alerts: 3,
  },
  {
    id: "vitepal",
    name: "VITEPAL",
    fullName: "Vitepal Salud",
    color: "#7866FA",
    currency: "CLP",
    channels: [
      { platform: "meta_ads",   planned:  700000, spent:  610000, lastSync: "hace 2 h", status: "warn" },
      { platform: "google_ads", planned:  500000, spent:  340000, lastSync: "hace 2 h", status: "ok" },
    ],
    alerts: 1,
  },
  {
    id: "norvial",
    name: "NORVIAL",
    fullName: "Norvial Concesiones",
    color: "#2EAD6B",
    currency: "CLP",
    channels: [
      { platform: "meta_ads",   planned:  450000, spent:  280000, lastSync: "hace 2 h", status: "low" },
      { platform: "google_ads", planned:  650000, spent:  470000, lastSync: "hace 2 h", status: "ok" },
    ],
    alerts: 0,
  },
  {
    id: "kibo",
    name: "KIBO",
    fullName: "Kibo Studio",
    color: "#D4A04A",
    currency: "USD",
    channels: [
      { platform: "meta_ads",   planned: 5000, spent: 4720, lastSync: "hace 2 h", status: "ok" },
      { platform: "google_ads", planned: 3000, spent: 1980, lastSync: "error",    status: "crit" },
    ],
    alerts: 1,
  },
  {
    id: "atrio",
    name: "ATRIO",
    fullName: "Atrio Inmobiliaria",
    color: "#0B0B0F",
    currency: "CLP",
    channels: [
      { platform: "meta_ads",   planned: 1200000, spent:  720000, lastSync: "hace 2 h", status: "ok" },
      { platform: "google_ads", planned:  800000, spent:  504000, lastSync: "hace 2 h", status: "ok" },
    ],
    alerts: 0,
  },
];

// Para cada cuenta: total
function accountTotals(acc) {
  const planned = acc.channels.reduce((s, c) => s + c.planned, 0);
  const spent = acc.channels.reduce((s, c) => s + c.spent, 0);
  return { planned, spent, ratio: spent / planned };
}

// Estado global de cada cuenta (worst-of de canales)
function accountStatus(acc) {
  if (acc.channels.some(c => c.status === "crit")) return "crit";
  if (acc.channels.some(c => c.status === "warn")) return "warn";
  if (acc.channels.some(c => c.status === "low"))  return "low";
  return "ok";
}

// Detalle CHC para vista de detalle
function dailySpendCHC() {
  // Days 1..22 (today). Generamos serie realista: meta y google
  // Plan diario lineal: meta=50000, google=66666
  const series = [];
  // semilla determinística
  const rand = (seed) => {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  };
  const r = rand(42);
  let metaCum = 0, googleCum = 0;
  for (let d = 1; d <= TODAY_DAY; d++) {
    // base + variación
    const meta = 50000 + (r() - 0.4) * 30000 + (d > 15 ? 6000 : 0);
    const google = 60000 + (r() - 0.5) * 35000 + (d > 10 ? 8000 : 0);
    metaCum += meta;
    googleCum += google;
    series.push({
      day: d,
      meta: Math.round(meta),
      google: Math.round(google),
      metaCum: Math.round(metaCum),
      googleCum: Math.round(googleCum),
      total: Math.round(meta + google),
      totalCum: Math.round(metaCum + googleCum),
    });
  }
  return series;
}

const CHC_DAILY = dailySpendCHC();

// Conexiones (algunas con error, una sin configurar)
const CONNECTIONS = [
  { accountId: "chc",      platform: "meta_ads",   externalId: "act_184729301847", status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "chc",      platform: "google_ads", externalId: "742-301-9384",     status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "link-uss", platform: "meta_ads",   externalId: "act_293847102938", status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "link-uss", platform: "google_ads", externalId: "839-274-1029",     status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "vitepal",  platform: "meta_ads",   externalId: "act_473829104728", status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "vitepal",  platform: "google_ads", externalId: null,               status: "unset",  lastSync: null,             lastError: null },
  { accountId: "norvial",  platform: "meta_ads",   externalId: "act_198273645182", status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "norvial",  platform: "google_ads", externalId: "918-273-6451",     status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "kibo",     platform: "meta_ads",   externalId: "act_736451829364", status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "kibo",     platform: "google_ads", externalId: "364-518-2936",     status: "error",  lastSync: "26 abr · 06:11", lastError: "INVALID_REFRESH_TOKEN — re-autorizar OAuth" },
  { accountId: "atrio",    platform: "meta_ads",   externalId: "act_518293645182", status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
  { accountId: "atrio",    platform: "google_ads", externalId: "182-936-4518",     status: "ok",     lastSync: "26 abr · 14:32", lastError: null },
];

const PLATFORM_LABELS = {
  meta_ads:    { name: "Meta Ads",     short: "M",  fullName: "Meta Marketing API" },
  google_ads:  { name: "Google Ads",   short: "G",  fullName: "Google Ads API v17" },
  linkedin_ads:{ name: "LinkedIn Ads", short: "L",  fullName: "LinkedIn Marketing" },
  youtube_ads: { name: "YouTube Ads",  short: "Y",  fullName: "YouTube Ads API" },
  tiktok_ads:  { name: "TikTok Ads",   short: "T",  fullName: "TikTok Ads API" },
  other:       { name: "Otro",         short: "·",  fullName: "Manual" },
};

window.AH_DATA = {
  TODAY_DAY, DAYS_IN_MONTH,
  ACCOUNTS, CONNECTIONS, CHC_DAILY, PLATFORM_LABELS,
  fmtCLP, fmtUSD, fmtMoney, fmtPct,
  accountTotals, accountStatus,
};
