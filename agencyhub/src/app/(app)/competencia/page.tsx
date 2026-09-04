import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function CompetenciaPage() {
  await requireAuth();

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { competitors: true, reports: true } },
      reports: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, type: true },
      },
    },
  });

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Competencia"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              ANÁLISIS
            </div>
            <h1 className="ah-page-title">
              Competencia<span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              Informes generados por el agente: uno diario y un resumen semanal
              por cliente.
            </p>
          </div>
        </div>

        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th style={{ width: 8 }}></th>
                <th>Cliente</th>
                <th className="num">Competidores</th>
                <th className="num">Informes</th>
                <th>Último</th>
                <th className="num"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const last = a.reports[0];
                return (
                  <tr key={a.id}>
                    <td>
                      <div
                        style={{
                          width: 6,
                          height: 28,
                          borderRadius: 1,
                          background: a.color,
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td className="num">
                      {a._count.competitors === 0 ? (
                        <StatusBadge kind="warn" label="sin definir" />
                      ) : (
                        a._count.competitors
                      )}
                    </td>
                    <td className="num">{a._count.reports}</td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {last ? `${isoDate(last.date)} · ${last.type}` : "—"}
                    </td>
                    <td className="num">
                      {a._count.reports > 0 ? (
                        <Link
                          href={`/competencia/${a.id}`}
                          className="ah-btn-ghost"
                          style={{ padding: "6px 12px", fontSize: 11 }}
                        >
                          Ver informes
                        </Link>
                      ) : (
                        <Link
                          href={`/cuentas/${a.id}`}
                          className="ah-btn-ghost"
                          style={{ padding: "6px 12px", fontSize: 11 }}
                        >
                          Configurar
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                    No hay clientes activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
