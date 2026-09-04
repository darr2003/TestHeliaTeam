import type { Platform } from "@/types";
import { PLATFORM_LABELS } from "@/types";

interface ChannelMarkProps {
  platform: Platform;
}

const PLATFORM_CLASS: Record<string, string> = {
  meta_ads: "meta",
  google_ads: "google",
  linkedin_ads: "linkedin",
  youtube_ads: "youtube",
  tiktok_ads: "tiktok",
  other: "other",
};

export function ChannelMark({ platform }: ChannelMarkProps) {
  const cls = PLATFORM_CLASS[platform] || "other";
  const label = PLATFORM_LABELS[platform];
  return <span className={`ah-channel-mark ${cls}`}>{label?.short ?? "·"}</span>;
}
