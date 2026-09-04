import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ReportData } from "@/app/(app)/reportes/report-document";

Font.register({
  family: "Manrope",
  fonts: [
    { src: "https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggqxSuXd.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggOxSuXd.ttf", fontWeight: 300 },
    { src: "https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggexSuXd.ttf", fontWeight: 700 },
  ],
});

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

const STATUS_COLORS: Record<string, string> = {
  ok: "#2EAD6B",
  warn: "#E8A838",
  crit: "#E8553A",
  low: "#7C5CFC",
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  overspend: "Sobregasto",
  low_budget: "Presupuesto bajo",
  abnormal_pace: "Ritmo anormal",
  connection_error: "Error de conexion",
};

const PLATFORM_NAMES: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  linkedin_ads: "LinkedIn Ads",
  youtube_ads: "YouTube Ads",
  tiktok_ads: "TikTok Ads",
  other: "Otro",
};

function fmtMoney(n: number, currency: string): string {
  if (currency === "USD") {
    return "US$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "$" + Math.round(n).toLocaleString("es-CL");
}

function fmtPct(ratio: number): string {
  return (ratio * 100).toFixed(1) + "%";
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Manrope", fontSize: 10, color: "#1A1A1A" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "2px solid #1A1A1A", paddingBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: { width: 20, height: 20, backgroundColor: "#1A1A1A", borderRadius: 4, color: "#FFF", textAlign: "center", lineHeight: 20, fontSize: 12, fontWeight: 700 },
  brandName: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: 300, marginBottom: 4 },
  subtitleRow: { flexDirection: "row", alignItems: "center", gap: 6, fontSize: 11, color: "#666" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, color: "#333" },
  summaryText: { fontSize: 10, lineHeight: 1.6, color: "#444", marginBottom: 14 },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  kpiBox: { flex: 1, padding: 10, backgroundColor: "#F7F7F7", borderRadius: 6 },
  kpiLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontSize: 14, fontWeight: 700 },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: "#F2F2F2", borderRadius: 4, padding: "6 8", marginBottom: 2 },
  tableRow: { flexDirection: "row", padding: "6 8", borderBottom: "1px solid #EAEAEA" },
  totalRow: { flexDirection: "row", padding: "6 8", borderTop: "2px solid #1A1A1A", marginTop: 2 },
  thCell: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#666" },
  tdCell: { fontSize: 9 },
  numCell: { textAlign: "right" },
  badge: { fontSize: 8, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 10, fontWeight: 700 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#AAA", borderTop: "1px solid #EAEAEA", paddingTop: 8 },
});

const colWidths = {
  channel: "18%",
  planned: "14%",
  spent: "14%",
  available: "14%",
  exec: "10%",
  pace: "10%",
  status: "14%",
};

function StatusBadge({ kind }: { kind: string }) {
  const bg = (STATUS_COLORS[kind] || "#999") + "20";
  const color = STATUS_COLORS[kind] || "#999";
  return (
    <Text style={[s.badge, { backgroundColor: bg, color }]}>
      {STATUS_LABELS[kind] || kind}
    </Text>
  );
}

export function ReportPDF({
  data,
  month,
  year,
}: {
  data: ReportData;
  month: number;
  year: number;
}) {
  const cur = data.account.currency;
  const monthName = MONTH_LONG[month - 1];
  const now = new Date();
  const timestamp = now.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const overallStatus =
    data.ratio > 1 ? "crit" : data.paceRatio > 1.15 ? "warn" : data.paceRatio < 0.7 && data.todayDay / data.daysInMonth > 0.3 ? "low" : "ok";

  const summaryText = (() => {
    const pct = (data.ratio * 100).toFixed(1);
    const daysLeft = data.daysInMonth - data.todayDay;
    if (data.ratio > 1)
      return `La cuenta ${data.account.name} ha superado el presupuesto planificado, alcanzando un ${pct}% de ejecucion al dia ${data.todayDay} del mes. Se requiere atencion inmediata.`;
    if (data.paceRatio > 1.15)
      return `La cuenta ${data.account.name} presenta un ritmo acelerado de gasto (${data.paceRatio.toFixed(2)}x) con ${pct}% ejecutado y ${daysLeft} dias restantes. Se recomienda monitorear de cerca.`;
    if (data.paceRatio < 0.7 && data.todayDay / data.daysInMonth > 0.3)
      return `La cuenta ${data.account.name} muestra un ritmo de gasto por debajo de lo esperado (${data.paceRatio.toFixed(2)}x) con ${pct}% ejecutado. Quedan ${daysLeft} dias para alcanzar el objetivo.`;
    return `La cuenta ${data.account.name} se encuentra dentro de los parametros normales con un ${pct}% de ejecucion al dia ${data.todayDay}. El ritmo de gasto (${data.paceRatio.toFixed(2)}x) esta alineado con el plan.`;
  })();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Reporte Mensual de Gasto</Text>
            <View style={s.subtitleRow}>
              <View style={[s.dot, { backgroundColor: data.account.color }]} />
              <Text>{data.account.name} · {monthName} {year}</Text>
            </View>
          </View>
          <View style={s.brandRow}>
            <Text style={s.brandMark}>C</Text>
            <Text style={s.brandName}>Cluster Media</Text>
          </View>
        </View>

        {/* Executive summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumen ejecutivo</Text>
          <Text style={s.summaryText}>{summaryText}</Text>
          <View style={s.kpiRow}>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Presupuesto</Text>
              <Text style={s.kpiValue}>{fmtMoney(data.totalPlanned, cur)}</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Gastado</Text>
              <Text style={s.kpiValue}>{fmtMoney(data.totalSpent, cur)}</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Disponible</Text>
              <Text style={s.kpiValue}>{fmtMoney(Math.max(0, data.remaining), cur)}</Text>
            </View>
          </View>
          <View style={[s.kpiRow, { marginTop: 8 }]}>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Ejecucion</Text>
              <Text style={s.kpiValue}>{fmtPct(data.ratio)}</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Ritmo</Text>
              <Text style={s.kpiValue}>{data.paceRatio.toFixed(2)}x</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Estado</Text>
              <StatusBadge kind={overallStatus} />
            </View>
          </View>
        </View>

        {/* Channel table */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Desglose por canal</Text>
          <View style={s.tableHeader}>
            <Text style={[s.thCell, { width: colWidths.channel }]}>Canal</Text>
            <Text style={[s.thCell, s.numCell, { width: colWidths.planned }]}>Planificado</Text>
            <Text style={[s.thCell, s.numCell, { width: colWidths.spent }]}>Gastado</Text>
            <Text style={[s.thCell, s.numCell, { width: colWidths.available }]}>Disponible</Text>
            <Text style={[s.thCell, s.numCell, { width: colWidths.exec }]}>% Ejec.</Text>
            <Text style={[s.thCell, s.numCell, { width: colWidths.pace }]}>Ritmo</Text>
            <Text style={[s.thCell, { width: colWidths.status }]}>Estado</Text>
          </View>
          {data.channels.map((ch) => (
            <View style={s.tableRow} key={ch.platform}>
              <Text style={[s.tdCell, { width: colWidths.channel }]}>{PLATFORM_NAMES[ch.platform] || ch.platform}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.planned }]}>{fmtMoney(ch.planned, cur)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.spent }]}>{fmtMoney(ch.spent, cur)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.available }]}>{fmtMoney(ch.planned - ch.spent, cur)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.exec }]}>{fmtPct(ch.ratio)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.pace }]}>{ch.paceRatio.toFixed(2)}x</Text>
              <View style={{ width: colWidths.status }}><StatusBadge kind={ch.status} /></View>
            </View>
          ))}
          {data.channels.length > 1 && (
            <View style={s.totalRow}>
              <Text style={[s.tdCell, { width: colWidths.channel, fontWeight: 700 }]}>Total</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.planned, fontWeight: 700 }]}>{fmtMoney(data.totalPlanned, cur)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.spent, fontWeight: 700 }]}>{fmtMoney(data.totalSpent, cur)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.available, fontWeight: 700 }]}>{fmtMoney(data.remaining, cur)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.exec, fontWeight: 700 }]}>{fmtPct(data.ratio)}</Text>
              <Text style={[s.tdCell, s.numCell, { width: colWidths.pace, fontWeight: 700 }]}>{data.paceRatio.toFixed(2)}x</Text>
              <Text style={{ width: colWidths.status }} />
            </View>
          )}
        </View>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Alertas del periodo ({data.alerts.length})</Text>
            <View style={s.tableHeader}>
              <Text style={[s.thCell, { width: "15%" }]}>Severidad</Text>
              <Text style={[s.thCell, { width: "18%" }]}>Tipo</Text>
              <Text style={[s.thCell, { width: "14%" }]}>Canal</Text>
              <Text style={[s.thCell, { width: "40%" }]}>Mensaje</Text>
              <Text style={[s.thCell, { width: "13%" }]}>Fecha</Text>
            </View>
            {data.alerts.map((a) => (
              <View style={s.tableRow} key={a.id}>
                <View style={{ width: "15%" }}>
                  <StatusBadge kind={a.severity === "critical" ? "crit" : "warn"} />
                </View>
                <Text style={[s.tdCell, { width: "18%" }]}>{ALERT_TYPE_LABELS[a.alertType] || a.alertType}</Text>
                <Text style={[s.tdCell, { width: "14%" }]}>{a.platform ? (PLATFORM_NAMES[a.platform] || a.platform) : "General"}</Text>
                <Text style={[s.tdCell, { width: "40%" }]}>{a.message}</Text>
                <Text style={[s.tdCell, { width: "13%", color: "#888" }]}>
                  {new Date(a.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>Fuente: AgencyHub · Cluster Media</Text>
          <Text>Generado el {timestamp}</Text>
        </View>
      </Page>
    </Document>
  );
}
