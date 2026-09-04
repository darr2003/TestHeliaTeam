import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentKeyIsValid } from "@/lib/reports/agent-auth";

/**
 * Lista de clientes activos, para el agente externo.
 *
 * Ojo con el reparto de responsabilidades, porque no es el que uno supondria:
 * el listado de competidores que alimenta el informe **vive en el agente**, no
 * aca. Los competidores que devuelve este endpoint son los de la ficha de
 * cliente, que son informativos, y pueden diferir legitimamente de los que el
 * informe termine cubriendo (10 en la ficha, 5 en el informe es un caso
 * esperado, no un error de sincronizacion).
 *
 * Lo que si conviene que el agente tome de aca son los **nombres de cliente**:
 * el campo `cliente` del frontmatter tiene que coincidir con `name` o la
 * ingesta responde 404.
 */
export async function GET(request: NextRequest) {
  if (!process.env.INGEST_API_KEY) {
    return NextResponse.json(
      { error: "INGEST_API_KEY no esta configurada en el servidor" },
      { status: 503 }
    );
  }

  if (!agentKeyIsValid(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      name: true,
      website: true,
      industry: true,
      competitors: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { name: true, website: true, notes: true },
      },
    },
  });

  return NextResponse.json({
    clientes: accounts.map((a) => ({
      cliente: a.name,
      sitio_web: a.website,
      industria: a.industry,
      competidores: a.competitors.map((c) => ({
        nombre: c.name,
        sitio_web: c.website,
        notas: c.notes,
      })),
    })),
  });
}
