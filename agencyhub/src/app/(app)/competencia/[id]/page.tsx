import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { listReports, loadReport } from "@/lib/reports/read";
import { renderMarkdown } from "@/lib/reports/markdown";
import { ReportNav } from "./nav";

export default async function CompetenciaClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fecha?: string; tipo?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { fecha, tipo } = await searchParams;

  const account = await prisma.account.findUnique({
    where: { id },
    select: { id: true, name: true, color: true, industry: true },
  });
  if (!account) notFound();

  const reports = await listReports(account.id);

  if (reports.length === 0) {
    return (
      <>
        <Topbar
          crumbs={["AgencyHub", "Competencia", account.name]}
          monthLabel=""
        />
        <div className="ah-content">
          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow">
                <span className="ah-eyebrow-line" />
                ANÁLISIS DE COMPETENCIA
              </div>
              <h1 className="ah-page-title">
                {account.name}
                <span className="cm-dot" />
              </h1>
              <p className="ah-page-sub">
                Todavía no hay informes para este cliente.
              </p>
            </div>
            <Link href={`/cuentas/${account.id}`} className="ah-btn-ghost">
              Ver ficha
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Tipo pedido, o el del informe más reciente si no se especificó.
  const requestedType =
    tipo === "semanal" || tipo === "diario" ? tipo : reports[0].type;

  const ofType = reports.filter((r) => r.type === requestedType);
  const available = ofType.length > 0 ? ofType : reports;
  const type = available[0].type;

  // Fecha pedida si existe para ese tipo; si no, la más reciente.
  const selectedDate =
    fecha && available.some((r) => r.date === fecha) ? fecha : available[0].date;

  const report = await loadReport(account.id, selectedDate, type);
  if (!report) notFound();

  const html = report.error ? null : renderMarkdown(report.body);

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Competencia", account.name]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              ANÁLISIS DE COMPETENCIA
            </div>
            <h1 className="ah-page-title">
              {account.name}
              <span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              Informe {type} del {report.date}
              {report.competidores && report.competidores.length > 0
                ? ` · ${report.competidores.join(", ")}`
                : ""}
            </p>
          </div>
          <Link href={`/cuentas/${account.id}`} className="ah-btn-ghost">
            Ver ficha
          </Link>
        </div>

        <ReportNav
          accountId={account.id}
          reports={reports}
          current={report.date}
          type={type}
        />

        {report.error ? (
          <div className="ah-field-error">{report.error}</div>
        ) : (
          <article
            className="ah-report"
            dangerouslySetInnerHTML={{ __html: html! }}
          />
        )}
      </div>
    </>
  );
}
