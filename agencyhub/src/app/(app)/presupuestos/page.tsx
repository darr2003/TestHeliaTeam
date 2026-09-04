import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { ChannelMark } from "@/components/ui";
import { fmtMoney } from "@/lib/formatters";
import { PLATFORM_LABELS } from "@/types";
import type { Platform } from "@/types";
import { DeleteBudgetButton } from "./delete-button";
import { requireFeature } from "@/lib/features";

export default async function PresupuestosPage() {
  requireFeature("spend");
  await requireAuth();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthLabel = now
    .toLocaleString("es-CL", { month: "short", year: "numeric" })
    .toUpperCase();

  const budgets = await prisma.budgetPlan.findMany({
    where: { month, year },
    orderBy: [{ account: { name: "asc" } }, { platform: "asc" }],
    include: { account: { select: { name: true, color: true, currency: true } } },
  });

  return (
    <>
      <Topbar
        crumbs={["AgencyHub", "Presupuestos"]}
        monthLabel={monthLabel}
      />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              PLAN MENSUAL
            </div>
            <h1 className="ah-page-title">
              Presupuestos<span className="cm-dot" />
            </h1>
          </div>
          <Link href="/presupuestos/nuevo" className="ah-btn">
            Nuevo presupuesto
          </Link>
        </div>

        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th style={{ width: 8 }}></th>
                <th>Cuenta</th>
                <th>Plataforma</th>
                <th className="num">Monto plan</th>
                <th>Moneda</th>
                <th>Notas</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const plat = b.platform as Platform;
                const platInfo = PLATFORM_LABELS[plat];
                return (
                  <tr key={b.id}>
                    <td>
                      <div
                        style={{
                          width: 6,
                          height: 28,
                          borderRadius: 1,
                          background: b.account.color,
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.account.name}</td>
                    <td>
                      <div className="ah-table-channel">
                        <ChannelMark platform={plat} />
                        {platInfo?.name || plat}
                      </div>
                    </td>
                    <td className="num">
                      {fmtMoney(Number(b.plannedAmount), b.currency)}
                    </td>
                    <td>{b.currency}</td>
                    <td className="muted" style={{ fontSize: 12, maxWidth: 200 }}>
                      {b.notes || "—"}
                    </td>
                    <td className="num">
                      <DeleteBudgetButton budgetId={b.id} />
                    </td>
                  </tr>
                );
              })}
              {budgets.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: "center" }}>
                    No hay presupuestos para este mes.
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
