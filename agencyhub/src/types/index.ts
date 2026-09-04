export type Currency = "CLP" | "USD";

export type Platform =
  | "meta_ads"
  | "google_ads"
  | "linkedin_ads"
  | "youtube_ads"
  | "tiktok_ads"
  | "other";

export type Status = "ok" | "warn" | "crit" | "low";
export type ConnectionStatus = "ok" | "error" | "unset";
export type BadgeKind = Status | "ghost";
export type AlertType = "overspend" | "low_budget" | "abnormal_pace" | "connection_error";
export type Severity = "warning" | "critical";
export type UserRole = "admin" | "editor";

export const PLATFORM_LABELS: Record<Platform, { name: string; short: string }> = {
  meta_ads: { name: "Meta Ads", short: "M" },
  google_ads: { name: "Google Ads", short: "G" },
  linkedin_ads: { name: "LinkedIn Ads", short: "L" },
  youtube_ads: { name: "YouTube Ads", short: "Y" },
  tiktok_ads: { name: "TikTok Ads", short: "T" },
  other: { name: "Otro", short: "·" },
};

export const PLATFORM_COLORS: Record<string, string> = {
  meta: "#1877F2",
  google: "#4285F4",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  tiktok: "#000000",
};
