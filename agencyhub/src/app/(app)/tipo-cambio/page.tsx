import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { requireFeature } from "@/lib/features";
import { ExchangeRateForm } from "./form";

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export default async function TipoCambioPage() {
  requireFeature("spend");
  await requireAdmin();

  const now = new Date();
  const year = now.getFullYear();

  const rates = await prisma.exchangeRate.findMany({
    where: { fromCurrency: "USD", toCurrency: "CLP", year },
    orderBy: { month: "asc" },
  });

  const rateMap = new Map(rates.map((r) => [r.month, Number(r.rate)]));

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Tipo de cambio"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              ADMINISTRACIÓN
            </div>
            <h1 className="ah-page-title">
              Tipo de <span className="cm-thin">cambio</span>
              <span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              USD → CLP mensual. Se usa para convertir presupuestos y gastos
              entre monedas.
            </p>
          </div>
        </div>

        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th className="num">1 USD = CLP</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((label, i) => {
                const m = i + 1;
                const rate = rateMap.get(m);
                return (
                  <tr key={m}>
                    <td style={{ fontWeight: 500 }}>
                      {label} {year}
                    </td>
                    <td className="num">
                      {rate ? `$${rate.toLocaleString("es-CL")}` : "—"}
                    </td>
                    <td>
                      <span
                        className={`ah-mini-status ${rate ? "" : "is-warn"}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ExchangeRateForm year={year} />
      </div>
    </>
  );
}
