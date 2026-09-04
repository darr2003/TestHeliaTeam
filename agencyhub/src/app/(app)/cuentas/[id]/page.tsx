import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEnabled } from "@/lib/features";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";
import { FichaForm } from "./ficha-form";
import { Competidores } from "./competidores";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      competitors: { orderBy: { name: "asc" } },
      _count: { select: { reports: true } },
    },
  });

  if (!account) notFound();

  const lastReport = await prisma.report.findFirst({
    where: { accountId: account.id },
    orderBy: { date: "desc" },
    select: { date: true, type: true },
  });

  const spendOn = isEnabled("spend");

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Clientes", account.name]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              FICHA DE CLIENTE
            </div>
            <h1 className="ah-page-title">
              {account.name}
              <span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              {account.industry || "Sin industria definida"}
              {" · "}
              {account.competitors.length}{" "}
              {account.competitors.length === 1 ? "competidor" : "competidores"}
              {" · "}
              {account._count.reports}{" "}
              {account._count.reports === 1 ? "informe" : "informes"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatusBadge
              kind={account.isActive ? "ok" : "crit"}
              label={account.isActive ? "Activa" : "Inactiva"}
            />
            {account._count.reports > 0 && (
              <Link href={`/competencia/${account.id}`} className="ah-btn">
                Ver competencia
              </Link>
            )}
            {spendOn && (
              <Link href={`/cuentas/${account.id}/gasto`} className="ah-btn-ghost">
                Ver gasto
              </Link>
            )}
          </div>
        </div>

        <div className="ah-section-head">
          <h2 className="ah-section-title">Datos</h2>
        </div>
        <FichaForm
          account={{
            id: account.id,
            name: account.name,
            color: account.color,
            currency: account.currency,
            legalName: account.legalName,
            industry: account.industry,
            website: account.website,
            contactName: account.contactName,
            contactEmail: account.contactEmail,
            contactPhone: account.contactPhone,
            relationStart: account.relationStart
              ? isoDate(account.relationStart)
              : null,
            notes: account.notes,
          }}
        />

        <div className="ah-section-head" style={{ marginTop: 32 }}>
          <h2 className="ah-section-title">Competencia</h2>
          <span className="muted" style={{ fontSize: 12 }}>
            {lastReport
              ? `Último informe: ${isoDate(lastReport.date)} (${lastReport.type})`
              : "Sin informes todavía"}
          </span>
        </div>
        <Competidores
          accountId={account.id}
          competitors={account.competitors.map((c) => ({
            id: c.id,
            name: c.name,
            website: c.website,
            notes: c.notes,
          }))}
        />
      </div>
    </>
  );
}
