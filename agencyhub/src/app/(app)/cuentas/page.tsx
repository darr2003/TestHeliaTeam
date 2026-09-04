import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEnabled } from "@/lib/features";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";
import { ToggleAccountButton } from "./toggle-button";

export default async function CuentasPage() {
  await requireAuth();

  const spendOn = isEnabled("spend");

  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      creator: { select: { name: true } },
      _count: {
        select: {
          budgetPlans: true,
          platformConnections: true,
          competitors: true,
          reports: true,
        },
      },
    },
  });

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Clientes"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              GESTIÓN
            </div>
            <h1 className="ah-page-title">
              Clientes<span className="cm-dot" />
            </h1>
          </div>
          <Link href="/cuentas/nueva" className="ah-btn">
            Nuevo cliente
          </Link>
        </div>

        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th style={{ width: 8 }}></th>
                <th>Nombre</th>
                <th>Industria</th>
                <th>Moneda</th>
                <th>Estado</th>
                <th className="num">Competidores</th>
                <th className="num">Informes</th>
                {spendOn && <th className="num">Presupuestos</th>}
                {spendOn && <th className="num">Conexiones</th>}
                <th>Creado por</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
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
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/cuentas/${a.id}`}>{a.name}</Link>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {a.industry || "—"}
                  </td>
                  <td>
                    <StatusBadge
                      kind={a.currency === "USD" ? "low" : "ghost"}
                      label={a.currency}
                    />
                  </td>
                  <td>
                    <StatusBadge
                      kind={a.isActive ? "ok" : "crit"}
                      label={a.isActive ? "Activa" : "Inactiva"}
                    />
                  </td>
                  <td className="num">
                    {a._count.competitors === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      a._count.competitors
                    )}
                  </td>
                  <td className="num">
                    {a._count.reports === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <Link href={`/competencia/${a.id}`}>{a._count.reports}</Link>
                    )}
                  </td>
                  {spendOn && <td className="num">{a._count.budgetPlans}</td>}
                  {spendOn && (
                    <td className="num">{a._count.platformConnections}</td>
                  )}
                  <td className="muted" style={{ fontSize: 12 }}>
                    {a.creator.name}
                  </td>
                  <td className="num">
                    <ToggleAccountButton accountId={a.id} isActive={a.isActive} />
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={spendOn ? 11 : 9}
                    className="muted"
                    style={{ textAlign: "center" }}
                  >
                    No hay clientes. Crea el primero.
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
