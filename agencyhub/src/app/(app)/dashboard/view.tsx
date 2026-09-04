"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge, ProgressBar, ChannelMark } from "@/components/ui";
import { fmtMoney, fmtPct, fmtCompact } from "@/lib/formatters";
import { PLATFORM_LABELS } from "@/types";
import type { DashboardData, AccountRow } from "@/lib/dashboard";
import type { Currency, Platform } from "@/types";
import { runSyncAll } from "../conexiones/actions";

const MONTH_NAMES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

export function DashboardView({
  data,
  month,
  year,
}: {
  data: DashboardData;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"todas" | "alertas" | "critico">("todas");
  const [isPending, startTransition] = useTransition();

  const monthLabel = `${MONTH_NAMES[month - 1]} · ${year}`;

  const handleSync = useCallback(() => {
    startTransition(async () => {
      await runSyncAll();
      router.refresh();
    });
  }, [router, startTransition]);

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/dashboard?m=${m}&y=${y}`);
  };

  const visible =
    filter === "critico"
      ? data.accounts.filter((a) => a.status === "crit")
      : filter === "alertas"
        ? data.accounts.filter((a) => a.status !== "ok")
        : data.accounts;

  const critCount = data.accounts.filter((a) => a.status === "crit").length;
  const alertCount = data.accounts.filter((a) => a.status !== "ok").length;

  const plan = fmtCompact(data.totalPlannedCLP, "CLP");
  const spent = fmtCompact(data.totalSpentCLP, "CLP");

  return (
    <>
      <Topbar
        crumbs={["AgencyHub", "Dashboard"]}
        monthLabel={monthLabel}
        syncLabel={isPending ? "Sincronizando…" : "Sincronizar todas"}
        onSync={handleSync}
        onPrevMonth={() => navigate(-1)}
        onNextMonth={() => navigate(1)}
      />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              01 / DASHBOARD
            </div>
            <h1 className="ah-page-title">
              Plan vs <span className="cm-thin">real</span>, todas las cuentas
              <span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              Día {data.todayDay} de {data.daysInMonth}
              {data.todayDay === 0 && " · Mes futuro, sin datos aún"}
            </p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="ah-kpi-strip">
          <div className="ah-kpi">
            <span className="ah-kpi-label">Presupuesto · CLP</span>
            <span className="ah-kpi-value tabnum">
              {plan.value}
              <span className="ah-kpi-unit">{plan.unit}</span>
            </span>
            <span className="ah-kpi-foot">
              <span>{data.activeCount} cuentas activas</span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">
              Gastado al día {data.todayDay}
            </span>
            <span className="ah-kpi-value tabnum">
              {spent.value}
              <span className="ah-kpi-unit">{spent.unit}</span>
            </span>
            <span className="ah-kpi-foot">
              <span className="ah-kpi-delta">
                {fmtPct(data.globalRatio)} ejecución global
              </span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Ritmo agencia</span>
            <span className="ah-kpi-value tabnum">
              {data.paceRatio.toFixed(2)}
              <span className="ah-kpi-unit">×</span>
            </span>
            <span className="ah-kpi-foot">
              <StatusBadge kind={data.paceRatio > 1.15 ? "warn" : "ok"} label={data.paceRatio > 1.15 ? "Acelerado" : "Normal"} />
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Cuentas en alerta</span>
            <span
              className="ah-kpi-value tabnum"
              style={{
                color: alertCount > 0 ? "var(--ah-crit)" : "var(--cm-ink)",
              }}
            >
              {alertCount}
            </span>
            <span className="ah-kpi-foot">
              {critCount > 0 && (
                <span style={{ color: "var(--ah-crit)" }}>
                  {critCount} crítica{critCount > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Section: cuentas */}
        <div className="ah-section">
          <div className="ah-section-head">
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 18,
              }}
            >
              <h2 className="ah-section-title">Cuentas</h2>
              <span className="ah-section-meta">
                {data.accounts.length} cuentas · ordenadas por estado
              </span>
            </div>
            <div className="ah-filterbar">
              <button
                className={`ah-chip ${filter === "todas" ? "is-active" : ""}`}
                onClick={() => setFilter("todas")}
              >
                Todas{" "}
                <span className="ah-chip-count">{data.accounts.length}</span>
              </button>
              <button
                className={`ah-chip ${filter === "alertas" ? "is-active" : ""}`}
                onClick={() => setFilter("alertas")}
              >
                Con alertas{" "}
                <span className="ah-chip-count">{alertCount}</span>
              </button>
              <button
                className={`ah-chip ${filter === "critico" ? "is-active" : ""}`}
                onClick={() => setFilter("critico")}
              >
                Críticas{" "}
                <span className="ah-chip-count">{critCount}</span>
              </button>
            </div>
          </div>

          <div className="ah-account-list">
            {visible.map((acc) => (
              <AccountRowItem
                key={acc.id}
                acc={acc}
                dayRatio={data.todayDay / data.daysInMonth}
                month={month}
                year={year}
              />
            ))}
            {visible.length === 0 && (
              <div
                style={{
                  padding: "40px 8px",
                  textAlign: "center",
                  color: "var(--cm-ink-40)",
                  fontSize: 14,
                }}
              >
                No hay cuentas que coincidan con el filtro.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AccountRowItem({
  acc,
  dayRatio,
  month,
  year,
}: {
  acc: AccountRow;
  dayRatio: number;
  month: number;
  year: number;
}) {
  const statusLabels = {
    crit: "Crítico",
    warn: "Atención",
    low: "Subgasto",
    ok: "Normal",
  };

  return (
    <Link
      href={`/cuentas/${acc.id}?m=${month}&y=${year}`}
      className={`ah-account-row ${acc.status !== "ok" ? `is-${acc.status}` : ""}`}
    >
      <div className="ah-account-id">
        <div
          className="ah-account-swatch"
          style={{ background: acc.color }}
        />
        <div>
          <span className="ah-account-name">{acc.name}</span>
          <span className="ah-account-meta">{acc.currency}</span>
        </div>
      </div>

      <div className="ah-account-channels">
        {acc.channels.map((ch) => {
          const platInfo = PLATFORM_LABELS[ch.platform as Platform];
          return (
            <div key={ch.platform} className="ah-channel-line">
              <span className="ah-channel-name">
                <span
                  className={`ah-mini-status is-${ch.status}`}
                  style={{ display: "inline-block", marginRight: 6 }}
                />
                {platInfo?.name || ch.platform}
              </span>
              <div className="ah-channel-bar-wrap">
                <ProgressBar
                  ratio={ch.ratio}
                  status={ch.status}
                  paceMarker={dayRatio}
                />
              </div>
              <span className="ah-channel-amount">
                {fmtMoney(ch.spent, acc.currency as Currency)}
              </span>
            </div>
          );
        })}
        {acc.channels.length === 0 && (
          <span
            style={{
              fontFamily: "var(--cm-mono)",
              fontSize: 11,
              color: "var(--cm-ink-40)",
            }}
          >
            Sin presupuesto este mes
          </span>
        )}
      </div>

      <div className="ah-account-summary">
        <span
          className={`ah-account-pct tabnum ${
            acc.status === "crit"
              ? "is-crit"
              : acc.status === "warn"
                ? "is-warn"
                : ""
          }`}
        >
          {(acc.ratio * 100).toFixed(1)}
          <span className="ah-pct-unit">%</span>
        </span>
        <span className="ah-account-totals">
          {fmtMoney(acc.totalSpent, acc.currency as Currency)} /{" "}
          {fmtMoney(acc.totalPlanned, acc.currency as Currency)}
        </span>
      </div>

      <div className="ah-account-status">
        <StatusBadge kind={acc.status} label={statusLabels[acc.status]} />
      </div>
    </Link>
  );
}
