"use client";

import { useRouter } from "next/navigation";
import type { ReportListItem } from "@/lib/reports/read";

/**
 * Navegación por fechas del informe. Los "anterior/siguiente" se mueven entre
 * informes que existen de verdad, no entre días del calendario: si el agente
 * no corrió un día, no hay a dónde ir y el botón se deshabilita.
 */
export function ReportNav({
  accountId,
  reports,
  current,
  type,
}: {
  accountId: string;
  reports: ReportListItem[];
  current: string;
  type: "diario" | "semanal";
}) {
  const router = useRouter();

  const sameType = reports.filter((r) => r.type === type);
  const index = sameType.findIndex((r) => r.date === current);

  // reports viene ordenado de más nuevo a más viejo.
  const newer = index > 0 ? sameType[index - 1] : null;
  const older = index >= 0 && index < sameType.length - 1 ? sameType[index + 1] : null;

  const go = (date: string, nextType: "diario" | "semanal" = type) => {
    router.push(`/competencia/${accountId}?tipo=${nextType}&fecha=${date}`);
  };

  const switchType = (nextType: "diario" | "semanal") => {
    if (nextType === type) return;
    const candidates = reports.filter((r) => r.type === nextType);
    if (candidates.length === 0) return;
    // Al cambiar de tipo, cae en el informe más cercano hacia atrás.
    const target =
      candidates.find((r) => r.date <= current) ?? candidates[candidates.length - 1];
    go(target.date, nextType);
  };

  const hasSemanal = reports.some((r) => r.type === "semanal");
  const hasDiario = reports.some((r) => r.type === "diario");

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        <button
          className={type === "diario" ? "ah-btn" : "ah-btn-ghost"}
          style={{ padding: "6px 14px", fontSize: 11 }}
          disabled={!hasDiario}
          onClick={() => switchType("diario")}
        >
          Diario
        </button>
        <button
          className={type === "semanal" ? "ah-btn" : "ah-btn-ghost"}
          style={{ padding: "6px 14px", fontSize: 11 }}
          disabled={!hasSemanal}
          onClick={() => switchType("semanal")}
        >
          Semanal
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          className="ah-btn-ghost"
          style={{ padding: "6px 12px", fontSize: 11 }}
          disabled={!older}
          onClick={() => older && go(older.date)}
          title={older ? older.date : "No hay informes anteriores"}
        >
          ←
        </button>

        <select
          value={current}
          onChange={(e) => go(e.target.value)}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {sameType.map((r) => (
            <option key={r.date} value={r.date}>
              {r.date}
            </option>
          ))}
        </select>

        <button
          className="ah-btn-ghost"
          style={{ padding: "6px 12px", fontSize: 11 }}
          disabled={!newer}
          onClick={() => newer && go(newer.date)}
          title={newer ? newer.date : "No hay informes posteriores"}
        >
          →
        </button>
      </div>

      <span className="muted" style={{ fontSize: 11 }}>
        {sameType.length} {sameType.length === 1 ? "informe" : "informes"}{" "}
        {type === "diario" ? "diarios" : "semanales"}
      </span>
    </div>
  );
}
