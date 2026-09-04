import "server-only";
import { prisma } from "@/lib/prisma";
import { getMarkdown } from "@/lib/reports/storage";
import { parseReport } from "@/lib/reports/frontmatter";

export interface ReportListItem {
  id: string;
  date: string; // ISO YYYY-MM-DD
  type: "diario" | "semanal";
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Indice de informes de una cuenta, mas reciente primero. */
export async function listReports(accountId: string): Promise<ReportListItem[]> {
  const rows = await prisma.report.findMany({
    where: { accountId },
    orderBy: { date: "desc" },
    select: { id: true, date: true, type: true },
  });

  return rows.map((r) => ({ id: r.id, date: isoDate(r.date), type: r.type }));
}

export interface LoadedReport {
  id: string;
  date: string;
  type: "diario" | "semanal";
  body: string;
  competidores?: string[];
  /** Presente si el informe no se pudo leer del almacenamiento. */
  error?: string;
}

/**
 * Carga un informe puntual. El markdown puede estar en R2 o inline en la DB
 * segun como estaba configurado el sistema al momento de la ingesta, asi que
 * se resuelve por fila y no por configuracion actual.
 */
export async function loadReport(
  accountId: string,
  date: string,
  type: "diario" | "semanal"
): Promise<LoadedReport | null> {
  const row = await prisma.report.findUnique({
    where: {
      accountId_date_type: {
        accountId,
        date: new Date(`${date}T00:00:00Z`),
        type,
      },
    },
    select: { id: true, date: true, type: true, storageKey: true, content: true },
  });

  if (!row) return null;

  const base = { id: row.id, date: isoDate(row.date), type: row.type };

  let raw: string;
  if (row.content) {
    raw = row.content;
  } else if (row.storageKey) {
    try {
      raw = await getMarkdown(row.storageKey);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error desconocido";
      return { ...base, body: "", error: `No se pudo leer el informe: ${msg}` };
    }
  } else {
    return { ...base, body: "", error: "El informe no tiene contenido asociado." };
  }

  try {
    const parsed = parseReport(raw);
    return { ...base, body: parsed.body, competidores: parsed.meta.competidores };
  } catch {
    // Si el frontmatter se corrompio despues de ingresar, es mejor mostrar el
    // markdown completo que no mostrar nada.
    return { ...base, body: raw };
  }
}
