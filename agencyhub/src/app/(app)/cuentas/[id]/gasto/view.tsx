"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge, ChannelMark } from "@/components/ui";
import { fmtMoney, fmtPct, fmtCompact } from "@/lib/formatters";
import { PLATFORM_LABELS } from "@/types";
import type { AccountDetailData } from "@/lib/dashboard";
import type { Currency, Platform } from "@/types";
import { SpendChart } from "./chart";
import { runSyncAll } from "../../../conexiones/actions";

const MONTH_NAMES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const MONTH_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function AccountDetailView({
  data,
  month,
  year,
}: {
  data: AccountDetailData;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { account: acc } = data;
  const cur = acc.currency as Currency;
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
    router.push(`/cuentas/${acc.id}?m=${m}&y=${y}`);
  };

  const plan = fmtCompact(data.totalPlanned, cur);
  const spent = fmtCompact(data.totalSpent, cur);
  const remaining = fmtCompact(Math.max(0, data.remaining), cur);
  const dailyAvg = fmtCompact(data.dailyAvg, cur);
  const expectedDaily =
    data.daysInMonth > 0
      ? fmtCompact(data.totalPlanned / data.daysInMonth, cur)
      : { value: "—", unit: "" };
  const monthPct =
    data.daysInMonth > 0
      ? Math.round((data.todayDay / data.daysInMonth) * 100)
      : 0;

  const statusLabels: Record<string, string> = {
    crit: "Crítico",
    warn: "Atención",
    low: "Subgasto",
    ok: "Normal",
  };

  return (
    <>
      <Topbar
        crumbs={["AgencyHub", "Dashboard", acc.name]}
        monthLabel={monthLabel}
        syncLabel={isPending ? "Sincronizando…" : "Sincronizar ahora"}
        onSync={handleSync}
        onPrevMonth={() => navigate(-1)}
        onNextMonth={() => navigate(1)}
      />
      <div className="ah-content">
        {/* Account header */}
        <div className="ah-account-header">
          <div className="ah-account-header-left">
            <div
              className="ah-account-header-swatch"
              style={{ background: acc.color }}
            />
            <div>
              <div className="ah-eyebrow">
                <span className="ah-eyebrow-line" />
                CUENTA
              </div>
              <h1 style={{
                fontFamily: "var(--cm-sans)",
                fontWeight: 800,
                fontSize: 56,
                letterSpacing: "-0.035em",
                lineHeight: 0.94,
                margin: 0,
              }}>
                {acc.name}
                <span className="cm-dot" />
              </h1>
              <div className="ah-account-header-meta">
                <span>{acc.currency}</span>
                <span className="ah-meta-dot" />
                <span>{data.channels.length} canales</span>
              </div>
            </div>
          </div>
          <div className="ah-account-header-right">
            {data.channels.map((ch) => (
              <StatusBadge key={ch.platform} kind={ch.status}>
                {PLATFORM_LABELS[ch.platform as Platform]?.name} ·{" "}
                {fmtPct(ch.ratio)} del plan
              </StatusBadge>
            ))}
          </div>
        </div>

        {/* KPI strip — 6 columns */}
        <div className="ah-kpi-strip ah-kpi-strip-6">
          <div className="ah-kpi">
            <span className="ah-kpi-label">Planificado</span>
            <span className="ah-kpi-value tabnum">
              {plan.value}
              <span className="ah-kpi-unit">{plan.unit}</span>
            </span>
            <span className="ah-kpi-foot">
              <span>{data.channels.length} canales</span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Gastado</span>
            <span className="ah-kpi-value tabnum">
              {spent.value}
              <span className="ah-kpi-unit">{spent.unit}</span>
            </span>
            <span className="ah-kpi-foot">
              <span>{fmtPct(data.ratio)} ejecución</span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Disponible</span>
            <span className="ah-kpi-value tabnum">
              {remaining.value}
              <span className="ah-kpi-unit">{remaining.unit}</span>
            </span>
            <span className="ah-kpi-foot">
              <span>
                quedan {data.daysInMonth - data.todayDay} días
              </span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Días</span>
            <span className="ah-kpi-value tabnum">
              {data.todayDay}
              <span
                className="ah-kpi-unit"
                style={{ color: "var(--cm-ink-40)" }}
              >
                / {data.daysInMonth}
              </span>
            </span>
            <span className="ah-kpi-foot">
              <span>{monthPct}% del mes</span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Gasto diario prom.</span>
            <span className="ah-kpi-value tabnum">
              {dailyAvg.value}
              <span className="ah-kpi-unit">{dailyAvg.unit}</span>
            </span>
            <span className="ah-kpi-foot">
              <span>
                esperado: {expectedDaily.value}
                {expectedDaily.unit}
              </span>
            </span>
          </div>
          <div className="ah-kpi">
            <span className="ah-kpi-label">Ritmo</span>
            <span className="ah-kpi-value tabnum">
              {data.paceRatio.toFixed(2)}
              <span className="ah-kpi-unit">×</span>
            </span>
            <span className="ah-kpi-foot">
              <StatusBadge
                kind={
                  data.paceRatio > 1.5
                    ? "crit"
                    : data.paceRatio > 1.3
                      ? "warn"
                      : "ok"
                }
                label={
                  data.paceRatio > 1.5
                    ? "Crítico"
                    : data.paceRatio > 1.3
                      ? "Acelerado"
                      : "Normal"
                }
              />
            </span>
          </div>
        </div>

        {/* Plan vs Real table */}
        <div className="ah-section">
          <div className="ah-section-head">
            <h2 className="ah-section-title">Plan vs real · por canal</h2>
            <span className="ah-section-meta">
              {MONTH_LONG[month - 1]} {year} · día {data.todayDay} de{" "}
              {data.daysInMonth}
            </span>
          </div>
          <div className="ah-table-wrap">
            <table className="ah-table">
              <thead>
                <tr>
                  <th>Canal</th>
                  <th className="num">Planificado</th>
                  <th className="num">Gastado</th>
                  <th className="num">Disponible</th>
                  <th className="num">% Ejec.</th>
                  <th>Ritmo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((ch) => (
                  <tr key={ch.platform}>
                    <td>
                      <span className="ah-table-channel">
                        <ChannelMark platform={ch.platform as Platform} />
                        {PLATFORM_LABELS[ch.platform as Platform]?.name ||
                          ch.platform}
                      </span>
                    </td>
                    <td className="num">
                      {fmtMoney(ch.planned, cur)}
                    </td>
                    <td className="num">
                      {fmtMoney(ch.spent, cur)}
                    </td>
                    <td className="num muted">
                      {fmtMoney(ch.planned - ch.spent, cur)}
                    </td>
                    <td className="num">
                      <strong>{(ch.ratio * 100).toFixed(1)}%</strong>
                    </td>
                    <td>
                      <StatusBadge kind={ch.paceKind} label={ch.paceLabel} />
                    </td>
                    <td>
                      <StatusBadge kind={ch.status} label={statusLabels[ch.status]} />
                    </td>
                  </tr>
                ))}
                {data.channels.length > 0 && (
                  <tr className="is-total">
                    <td>Total cuenta</td>
                    <td className="num">
                      {fmtMoney(data.totalPlanned, cur)}
                    </td>
                    <td className="num">
                      {fmtMoney(data.totalSpent, cur)}
                    </td>
                    <td className="num">
                      {fmtMoney(data.remaining, cur)}
                    </td>
                    <td className="num">
                      {(data.ratio * 100).toFixed(1)}%
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                )}
                {data.channels.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="muted"
                      style={{ textAlign: "center" }}
                    >
                      Sin presupuesto para este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cumulative chart */}
        {data.dailySpend.length > 0 && (
          <div className="ah-chart-card">
            <div className="ah-chart-head">
              <div>
                <h2
                  className="ah-section-title"
                  style={{ fontSize: 16 }}
                >
                  Gasto acumulado · día a día
                </h2>
                <span
                  className="ah-section-meta"
                  style={{ marginTop: 4, display: "block" }}
                >
                  Real vs plan lineal
                </span>
              </div>
              <div className="ah-chart-legend">
                <span className="ah-chart-legend-item">
                  <span className="ah-legend-swatch" />
                  Total real
                </span>
                <span className="ah-chart-legend-item">
                  <span className="ah-legend-swatch dashed" />
                  Plan lineal
                </span>
              </div>
            </div>
            <SpendChart
              daily={data.dailySpend}
              plannedTotal={data.totalPlanned}
              daysInMonth={data.daysInMonth}
              todayDay={data.todayDay}
              currency={acc.currency}
            />
          </div>
        )}

        {/* Daily table */}
        {data.dailySpend.length > 0 && (
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">
                Gasto diario · últimos 7 días
              </h2>
            </div>
            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    {data.channels.map((ch) => (
                      <th key={ch.platform} className="num">
                        {PLATFORM_LABELS[ch.platform as Platform]?.name}
                      </th>
                    ))}
                    <th className="num">Total día</th>
                    <th className="num">Acumulado</th>
                    <th className="num">% del plan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailySpend.slice(-7).map((d) => (
                    <tr key={d.day}>
                      <td className="muted">{d.date}</td>
                      {data.channels.map((ch) => (
                        <td key={ch.platform} className="num">
                          {fmtMoney(
                            d.byPlatform[ch.platform] || 0,
                            cur
                          )}
                        </td>
                      ))}
                      <td className="num">
                        <strong>{fmtMoney(d.total, cur)}</strong>
                      </td>
                      <td className="num muted">
                        {fmtMoney(d.cumulative, cur)}
                      </td>
                      <td className="num muted">
                        {data.totalPlanned > 0
                          ? (
                              (d.cumulative / data.totalPlanned) *
                              100
                            ).toFixed(1) + "%"
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
