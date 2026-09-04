/**
 * Parser del frontmatter de los informes de competencia.
 *
 * El contrato con el agente es: metadata minima obligatoria arriba, cuerpo
 * markdown 100% libre abajo. Esto parsea y valida solo la metadata; el cuerpo
 * no se toca ni se interpreta, para que el agente pueda cambiar el formato
 * del informe sin tocar la app.
 *
 * A proposito NO se usa un parser YAML generico: el frontmatter es un subset
 * plano y conocido, y un parser estricto da errores utiles al agente en vez
 * de aceptar cualquier cosa que despues rompe la navegacion.
 */

export type ReportType = "diario" | "semanal";

export interface ReportFrontmatter {
  cliente: string;
  fecha: string; // ISO YYYY-MM-DD
  tipo: ReportType;
  version: number;
  competidores?: string[];
}

export interface ParsedReport {
  meta: ReportFrontmatter;
  body: string;
}

export class FrontmatterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FrontmatterError";
  }
}

const DELIMITER = /^---[ \t]*$/;

function splitFrontmatter(raw: string): { yaml: string; body: string } {
  // Tolera BOM y saltos CRLF: el agente puede correr en cualquier runtime.
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  if (!DELIMITER.test(lines[0] ?? "")) {
    throw new FrontmatterError(
      "El informe debe empezar con un bloque de frontmatter delimitado por ---"
    );
  }

  const closing = lines.findIndex((l, i) => i > 0 && DELIMITER.test(l));
  if (closing === -1) {
    throw new FrontmatterError("Falta el --- de cierre del frontmatter");
  }

  return {
    yaml: lines.slice(1, closing).join("\n"),
    body: lines.slice(closing + 1).join("\n").trim(),
  };
}

function parseScalar(raw: string): string {
  let v = raw.trim();
  // Quita comentarios de fin de linea solo si no van dentro de comillas.
  if (!/^['"]/.test(v)) {
    v = v.replace(/\s+#.*$/, "").trim();
  }
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length > 1) ||
    (v.startsWith("'") && v.endsWith("'") && v.length > 1)
  ) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

function parseList(raw: string): string[] {
  const inner = raw.trim().slice(1, -1);
  if (!inner.trim()) return [];
  return inner
    .split(",")
    .map((s) => parseScalar(s))
    .filter((s) => s.length > 0);
}

function parseFields(yaml: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};

  for (const line of yaml.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const sep = line.indexOf(":");
    if (sep === -1) {
      throw new FrontmatterError(
        `Linea de frontmatter sin "clave: valor": ${line.trim()}`
      );
    }

    const key = line.slice(0, sep).trim();
    const rawValue = line.slice(sep + 1);

    if (!key) {
      throw new FrontmatterError(`Clave vacia en el frontmatter: ${line.trim()}`);
    }

    const trimmed = rawValue.trim();
    out[key] =
      trimmed.startsWith("[") && trimmed.endsWith("]")
        ? parseList(trimmed)
        : parseScalar(rawValue);
  }

  return out;
}

/** Valida formato Y validez real de la fecha (rechaza 2026-02-30). */
function assertIsoDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new FrontmatterError(
      `"${field}" debe tener formato YYYY-MM-DD, se recibio: ${value}`
    );
  }
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    throw new FrontmatterError(`"${field}" no es una fecha valida: ${value}`);
  }
  return value;
}

export function parseReport(raw: string): ParsedReport {
  const { yaml, body } = splitFrontmatter(raw);
  const fields = parseFields(yaml);

  const str = (key: string): string | undefined => {
    const v = fields[key];
    if (v === undefined) return undefined;
    if (Array.isArray(v)) {
      throw new FrontmatterError(`"${key}" debe ser un valor simple, no una lista`);
    }
    return v;
  };

  const cliente = str("cliente");
  if (!cliente) {
    throw new FrontmatterError('Falta "cliente" en el frontmatter');
  }

  const fechaRaw = str("fecha");
  if (!fechaRaw) {
    throw new FrontmatterError('Falta "fecha" en el frontmatter');
  }
  const fecha = assertIsoDate(fechaRaw, "fecha");

  const tipoRaw = str("tipo");
  if (!tipoRaw) {
    throw new FrontmatterError('Falta "tipo" en el frontmatter');
  }
  if (tipoRaw !== "diario" && tipoRaw !== "semanal") {
    throw new FrontmatterError(
      `"tipo" debe ser "diario" o "semanal", se recibio: ${tipoRaw}`
    );
  }
  const tipo: ReportType = tipoRaw;

  // El informe semanal se indexa por el lunes de su semana. Si el agente manda
  // otro dia, la navegacion por semanas quedaria con huecos, asi que se rechaza
  // aca en vez de aceptarlo y mostrar mal.
  if (tipo === "semanal") {
    const [y, m, d] = fecha.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (dow !== 1) {
      throw new FrontmatterError(
        `Un informe semanal debe fecharse el lunes de su semana; ${fecha} es ${
          ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][dow]
        }`
      );
    }
  }

  const versionRaw = str("version");
  let version = 1;
  if (versionRaw !== undefined && versionRaw !== "") {
    if (!/^\d+$/.test(versionRaw)) {
      throw new FrontmatterError(
        `"version" debe ser un entero, se recibio: ${versionRaw}`
      );
    }
    version = parseInt(versionRaw, 10);
    if (version < 1) {
      throw new FrontmatterError('"version" debe ser 1 o mayor');
    }
  }

  const competidoresRaw = fields["competidores"];
  const competidores = Array.isArray(competidoresRaw)
    ? competidoresRaw
    : competidoresRaw
      ? [competidoresRaw]
      : undefined;

  if (!body) {
    throw new FrontmatterError("El informe no tiene cuerpo despues del frontmatter");
  }

  return { meta: { cliente, fecha, tipo, version, competidores }, body };
}
