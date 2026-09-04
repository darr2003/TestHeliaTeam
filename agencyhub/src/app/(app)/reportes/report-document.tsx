"use client";

import { fmtMoney, fmtPct } from "@/lib/formatters";
import { PLATFORM_LABELS } from "@/types";
import type { Currency, Platform } from "@/types";
import { StatusBadge, ChannelMark } from "@/components/ui";

interface ChannelRow {
  platform: string;
  planned: number;
  spent: number;
  ratio: number;
  status: "ok" | "warn" | "crit" | "low";
  paceRatio: number;
  paceLabel: string;
}

interface AlertRow {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  platform: string | null;
  createdAt: string;
}

export interface ReportData {
  account: { id: string; name: string; color: string; currency: string };
  channels: ChannelRow[];
  totalPlanned: number;
  totalSpent: number;
  ratio: number;
  remaining: number;
  todayDay: number;
  daysInMonth: number;
  paceRatio: number;
  dailyAvg: number;
  alerts: AlertRow[];
}

const MONTH_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_LABELS: Record<string, string> = {
  crit: "Critico",
  warn: "Atencion",
  low: "Subgasto",
  ok: "Normal",
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  overspend: "Sobregasto",
  low_budget: "Presupuesto bajo",
  abnormal_pace: "Ritmo anormal",
  connection_error: "Error de conexion",
};

export function ReportDocument({
  data,
  month,
  year,
}: {
  data: ReportData;
  month: number;
  year: number;
}) {
  const cur = data.account.currency as Currency;
  const monthName = MONTH_LONG[month - 1];
  const now = new Date();
  const timestamp = now.toLocaleString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const overallStatus =
    data.ratio > 1 ? "crit" : data.paceRatio > 1.15 ? "warn" : data.paceRatio < 0.7 && data.todayDay / data.daysInMonth > 0.3 ? "low" : "ok";

  const summaryText = (() => {
    const pct = (data.ratio * 100).toFixed(1);
    const daysLeft = data.daysInMonth - data.todayDay;
    if (data.ratio > 1) {
      return `La cuenta ${data.account.name} ha superado el presupuesto planificado, alcanzando un ${pct}% de ejecucion al dia ${data.todayDay} del mes. Se requiere atencion inmediata.`;
    }
    if (data.paceRatio > 1.15) {
      return `La cuenta ${data.account.name} presenta un ritmo acelerado de gasto (${data.paceRatio.toFixed(2)}x) con ${pct}% ejecutado y ${daysLeft} dias restantes. Se recomienda monitorear de cerca.`;
    }
    if (data.paceRatio < 0.7 && data.todayDay / data.daysInMonth > 0.3) {
      return `La cuenta ${data.account.name} muestra un ritmo de gasto por debajo de lo esperado (${data.paceRatio.toFixed(2)}x) con ${pct}% ejecutado. Quedan ${daysLeft} dias para alcanzar el objetivo.`;
    }
    return `La cuenta ${data.account.name} se encuentra dentro de los parametros normales con un ${pct}% de ejecucion al dia ${data.todayDay}. El ritmo de gasto (${data.paceRatio.toFixed(2)}x) esta alineado con el plan.`;
  })();

  return (
    <div className="ah-report-doc">
      {/* Header */}
      <div className="ah-report-header">
        <div className="ah-report-brand">
          <span className="ah-report-brand-mark">C</span>
          <span className="ah-report-brand-name">Cluster Media</span>
        </div>
        <div className="ah-report-headline">
          <h1 className="ah-report-title">
            Reporte Mensual de Gasto
          </h1>
          <div className="ah-report-subtitle">
            <span
              className="ah-report-account-dot"
              style={{ background: data.account.color }}
            />
            {data.account.name} &middot; {monthName} {year}
          </div>
        </div>
      </div>

      {/* Executive summary */}
      <div className="ah-report-section">
        <h2 className="ah-report-section-title">Resumen ejecutivo</h2>
        <p className="ah-report-summary-text">{summaryText}</p>
        <div className="ah-report-kpi-row">
          <div className="ah-report-kpi">
            <span className="ah-report-kpi-label">Presupuesto</span>
            <span className="ah-report-kpi-value">{fmtMoney(data.totalPlanned, cur)}</span>
          </div>
          <div className="ah-report-kpi">
            <span className="ah-report-kpi-label">Gastado</span>
            <span className="ah-report-kpi-value">{fmtMoney(data.totalSpent, cur)}</span>
          </div>
          <div className="ah-report-kpi">
            <span className="ah-report-kpi-label">Disponible</span>
            <span className="ah-report-kpi-value">{fmtMoney(Math.max(0, data.remaining), cur)}</span>
          </div>
          <div className="ah-report-kpi">
            <span className="ah-report-kpi-label">Ejecucion</span>
            <span className="ah-report-kpi-value">{fmtPct(data.ratio)}</span>
          </div>
          <div className="ah-report-kpi">
            <span className="ah-report-kpi-label">Ritmo</span>
            <span className="ah-report-kpi-value">{data.paceRatio.toFixed(2)}x</span>
          </div>
          <div className="ah-report-kpi">
            <span className="ah-report-kpi-label">Estado</span>
            <StatusBadge kind={overallStatus} label={STATUS_LABELS[overallStatus]} />
          </div>
        </div>
      </div>

      {/* Channel breakdown */}
      <div className="ah-report-section">
        <h2 className="ah-report-section-title">Desglose por canal</h2>
        <table className="ah-report-table">
          <thead>
            <tr>
              <th>Canal</th>
              <th className="num">Planificado</th>
              <th className="num">Gastado</th>
              <th className="num">Disponible</th>
              <th className="num">% Ejec.</th>
              <th className="num">Ritmo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.channels.map((ch) => (
              <tr key={ch.platform}>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <ChannelMark platform={ch.platform as Platform} />
                    {PLATFORM_LABELS[ch.platform as Platform]?.name || ch.platform}
                  </span>
                </td>
                <td className="num">{fmtMoney(ch.planned, cur)}</td>
                <td className="num">{fmtMoney(ch.spent, cur)}</td>
                <td className="num">{fmtMoney(ch.planned - ch.spent, cur)}</td>
                <td className="num">{fmtPct(ch.ratio)}</td>
                <td className="num">{ch.paceRatio.toFixed(2)}x</td>
                <td>
                  <StatusBadge kind={ch.status} label={STATUS_LABELS[ch.status]} />
                </td>
              </tr>
            ))}
            {data.channels.length > 1 && (
              <tr className="is-total">
                <td>Total</td>
                <td className="num">{fmtMoney(data.totalPlanned, cur)}</td>
                <td className="num">{fmtMoney(data.totalSpent, cur)}</td>
                <td className="num">{fmtMoney(data.remaining, cur)}</td>
                <td className="num">{fmtPct(data.ratio)}</td>
                <td className="num">{data.paceRatio.toFixed(2)}x</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="ah-report-section">
          <h2 className="ah-report-section-title">
            Alertas del periodo ({data.alerts.length})
          </h2>
          <table className="ah-report-table">
            <thead>
              <tr>
                <th>Severidad</th>
                <th>Tipo</th>
                <th>Canal</th>
                <th>Mensaje</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.alerts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <StatusBadge
                      kind={a.severity === "critical" ? "crit" : "warn"}
                      label={a.severity === "critical" ? "Critico" : "Atencion"}
                    />
                  </td>
                  <td>{ALERT_TYPE_LABELS[a.alertType] || a.alertType}</td>
                  <td>
                    {a.platform
                      ? PLATFORM_LABELS[a.platform as Platform]?.name || a.platform
                      : "General"}
                  </td>
                  <td style={{ fontSize: 12 }}>{a.message}</td>
                  <td style={{ fontSize: 11, color: "var(--cm-ink-40)" }}>
                    {new Date(a.createdAt).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="ah-report-footer">
        <span>Fuente: AgencyHub &middot; Cluster Media</span>
        <span>Generado el {timestamp}</span>
      </div>
    </div>
  );
}
