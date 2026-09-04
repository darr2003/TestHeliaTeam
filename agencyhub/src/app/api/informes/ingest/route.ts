import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentKeyIsValid } from "@/lib/reports/agent-auth";
import { parseReport, FrontmatterError } from "@/lib/reports/frontmatter";
import { isR2Configured, putMarkdown, reportKey } from "@/lib/reports/storage";

export const maxDuration = 30;

/**
 * Ingesta de informes de competencia.
 *
 * El agente vive fuera de este repo y solo hace POST del markdown. Toda la
 * validacion pasa aca: si el frontmatter esta mal o el cliente no existe, el
 * agente recibe un error explicito en vez de que el informe se pierda en
 * silencio.
 *
 * Acepta el markdown como body crudo (text/markdown) o dentro de un JSON
 * {"markdown": "..."} para que sirva igual desde n8n o desde un Worker.
 */
export async function POST(request: NextRequest) {
  if (!process.env.INGEST_API_KEY) {
    return NextResponse.json(
      { error: "INGEST_API_KEY no esta configurada en el servidor" },
      { status: 503 }
    );
  }

  if (!agentKeyIsValid(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: string;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (typeof body?.markdown !== "string") {
        return NextResponse.json(
          { error: 'El JSON debe tener un campo "markdown" con el informe' },
          { status: 400 }
        );
      }
      raw = body.markdown;
    } else {
      raw = await request.text();
    }
  } catch {
    return NextResponse.json({ error: "Body ilegible" }, { status: 400 });
  }

  if (!raw.trim()) {
    return NextResponse.json({ error: "El informe llego vacio" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseReport(raw);
  } catch (e) {
    if (e instanceof FrontmatterError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    throw e;
  }

  const { meta } = parsed;

  // El cliente se resuelve por nombre porque es lo que el agente conoce.
  // Case-insensitive para no depender de como lo escriba.
  const account = await prisma.account.findFirst({
    where: { name: { equals: meta.cliente, mode: "insensitive" }, isActive: true },
    select: { id: true, name: true },
  });

  if (!account) {
    return NextResponse.json(
      {
        error: `El cliente "${meta.cliente}" no existe o esta inactivo en AgencyHub. Revisa GET /api/clientes/activos para los nombres validos.`,
      },
      { status: 404 }
    );
  }

  const date = new Date(`${meta.fecha}T00:00:00Z`);
  const bytes = Buffer.byteLength(raw, "utf8");

  // R2 si esta configurado; si no, el markdown queda inline en la DB.
  let storageKey: string | null = null;
  let content: string | null = null;

  if (isR2Configured()) {
    storageKey = reportKey(account.name, meta.fecha, meta.tipo);
    try {
      await putMarkdown(storageKey, raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error desconocido";
      return NextResponse.json(
        { error: `No se pudo guardar en R2: ${msg}` },
        { status: 502 }
      );
    }
  } else {
    content = raw;
  }

  // UPSERT: si el agente reprocesa un dia, sobreescribe en vez de duplicar.
  const report = await prisma.report.upsert({
    where: {
      accountId_date_type: { accountId: account.id, date, type: meta.tipo },
    },
    create: {
      accountId: account.id,
      date,
      type: meta.tipo,
      storageKey,
      content,
      version: meta.version,
      bytes,
    },
    update: { storageKey, content, version: meta.version, bytes },
    select: { id: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({
    ok: true,
    id: report.id,
    cliente: account.name,
    fecha: meta.fecha,
    tipo: meta.tipo,
    almacenamiento: storageKey ? "r2" : "db",
    key: storageKey,
    bytes,
    creado: report.createdAt.getTime() === report.updatedAt.getTime(),
  });
}
