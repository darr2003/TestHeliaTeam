"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";
import { ReportDocument } from "./report-document";
import type { ReportData } from "./report-document";

const MONTH_NAMES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const MONTH_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface Account {
  id: string;
  name: string;
  currency: string;
  color: string;
}

interface SyncLogRow {
  id: string;
  accountName: string;
  platform: string;
  syncType: string;
  status: string;
  recordsSynced: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportesView({
  accounts,
  syncLogs,
  month,
  year,
  selectedAccountId,
  reportData,
}: {
  accounts: Account[];
  syncLogs: SyncLogRow[];
  month: number;
  year: number;
  selectedAccountId: string | null;
  reportData: ReportData | null;
}) {
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const monthLabel = `${MONTH_NAMES[month - 1]} · ${year}`;

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    const params = new URLSearchParams({ m: String(m), y: String(y) });
    if (selectedAccountId) params.set("account", selectedAccountId);
    router.push(`/reportes?${params}`);
  };

  const selectAccount = (accountId: string) => {
    const params = new URLSearchParams({ m: String(month), y: String(year) });
    if (accountId) params.set("account", accountId);
    router.push(`/reportes?${params}`);
  };

  const downloadCSV = async (type: "dashboard" | "daily" | "alerts") => {
    setExporting(type);
    try {
      const res = await fetch(`/api/export?type=${type}&m=${month}&y=${year}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agencyhub_${type}_${MONTH_NAMES[month - 1]}_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar. Intenta de nuevo.");
    } finally {
      setExporting(null);
    }
  };

  const downloadPDF = async () => {
    if (!selectedAccountId) return;
    setExporting("pdf");
    try {
      const res = await fetch(
        `/api/reports/pdf?account_id=${selectedAccountId}&month=${month}&year=${year}`
      );
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${MONTH_NAMES[month - 1]}_${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar PDF. Intenta de nuevo.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <Topbar
        crumbs={["AgencyHub", "Reportes"]}
        monthLabel={monthLabel}
        onPrevMonth={() => navigate(-1)}
        onNextMonth={() => navigate(1)}
      />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              INFORMES
            </div>
            <h1 className="ah-page-title">
              Reportes<span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              {MONTH_LONG[month - 1]} {year} &middot; {accounts.length} cuentas activas
            </p>
          </div>
        </div>

        {/* Account selector + report */}
        <div className="ah-section">
          <div className="ah-section-head">
            <h2 className="ah-section-title">Reporte mensual por cuenta</h2>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <select
              className="ah-field-input"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--cm-rule)", fontFamily: "var(--cm-mono)", fontSize: 13, minWidth: 240 }}
              value={selectedAccountId || ""}
              onChange={(e) => selectAccount(e.target.value)}
            >
              <option value="">Selecciona una cuenta...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
            {reportData && (
              <button
                className="ah-btn"
                onClick={downloadPDF}
                disabled={exporting === "pdf"}
              >
                {exporting === "pdf" ? "Generando PDF..." : "Exportar PDF"}
              </button>
            )}
          </div>

          {selectedAccountId && !reportData && (
            <div className="ah-empty-state">
              <p>No hay datos para esta cuenta en el periodo seleccionado.</p>
            </div>
          )}

          {reportData && (
            <div ref={reportRef} className="ah-report-preview">
              <ReportDocument data={reportData} month={month} year={year} />
            </div>
          )}
        </div>

        {/* Export cards */}
        <div className="ah-section" style={{ marginTop: 40 }}>
          <div className="ah-section-head">
            <h2 className="ah-section-title">Exportar datos (CSV)</h2>
            <span className="ah-section-meta">Todas las cuentas</span>
          </div>
          <div className="ah-report-grid">
            <div className="ah-report-card">
              <div>
                <h3 className="ah-report-card-title">Resumen mensual</h3>
                <p className="ah-report-card-desc">
                  Plan vs real por cuenta y canal. Incluye presupuesto, gasto, % ejecucion, ritmo y estado.
                </p>
              </div>
              <button
                className="ah-btn"
                onClick={() => downloadCSV("dashboard")}
                disabled={exporting !== null}
              >
                {exporting === "dashboard" ? "Exportando..." : "Exportar CSV"}
              </button>
            </div>

            <div className="ah-report-card">
              <div>
                <h3 className="ah-report-card-title">Gasto diario</h3>
                <p className="ah-report-card-desc">
                  Detalle dia a dia de gasto por cuenta y plataforma. Ideal para analizar tendencias.
                </p>
              </div>
              <button
                className="ah-btn"
                onClick={() => downloadCSV("daily")}
                disabled={exporting !== null}
              >
                {exporting === "daily" ? "Exportando..." : "Exportar CSV"}
              </button>
            </div>

            <div className="ah-report-card">
              <div>
                <h3 className="ah-report-card-title">Historial de alertas</h3>
                <p className="ah-report-card-desc">
                  Todas las alertas generadas en el mes: tipo, severidad, cuenta, fecha.
                </p>
              </div>
              <button
                className="ah-btn"
                onClick={() => downloadCSV("alerts")}
                disabled={exporting !== null}
              >
                {exporting === "alerts" ? "Exportando..." : "Exportar CSV"}
              </button>
            </div>
          </div>
        </div>

        {/* Sync log history */}
        <div className="ah-section" style={{ marginTop: 40 }}>
          <div className="ah-section-head">
            <h2 className="ah-section-title">Historial de sincronizacion</h2>
            <span className="ah-section-meta">
              Ultimas 20 sincronizaciones de {MONTH_LONG[month - 1]}
            </span>
          </div>

          {syncLogs.length === 0 ? (
            <div className="ah-empty-state">
              <p>No hay sincronizaciones registradas este mes.</p>
            </div>
          ) : (
            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cuenta</th>
                    <th>Plataforma</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="num">Registros</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: "var(--cm-ink-60)" }}>
                        {fmtDate(log.startedAt)}
                      </td>
                      <td>{log.accountName}</td>
                      <td>
                        <span className="ah-platform-tag">
                          {log.platform === "meta_ads" ? "Meta Ads" : "Google Ads"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--cm-ink-40)" }}>
                          {log.syncType}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          kind={log.status === "success" ? "ok" : log.status === "error" ? "crit" : "ghost"}
                          label={log.status === "success" ? "OK" : log.status === "error" ? "Error" : log.status}
                        />
                      </td>
                      <td className="num">{log.recordsSynced}</td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--ah-crit)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={log.errorMessage || undefined}
                      >
                        {log.errorMessage || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
