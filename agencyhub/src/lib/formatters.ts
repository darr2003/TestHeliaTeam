import type { Currency } from "@/types";

export function fmtCLP(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

export function fmtUSD(n: number): string {
  return "US$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtMoney(n: number, currency: Currency): string {
  return currency === "USD" ? fmtUSD(n) : fmtCLP(n);
}

export function fmtPct(ratio: number): string {
  return (ratio * 100).toFixed(1) + "%";
}

export function fmtCompact(n: number, currency: Currency): { value: string; unit: string } {
  const prefix = currency === "USD" ? "US$" : "$";
  if (Math.abs(n) >= 1_000_000) return { value: prefix + (n / 1e6).toFixed(1), unit: "M" };
  if (Math.abs(n) >= 1_000) return { value: prefix + (n / 1e3).toFixed(1), unit: "K" };
  return { value: prefix + n.toFixed(0), unit: "" };
}
