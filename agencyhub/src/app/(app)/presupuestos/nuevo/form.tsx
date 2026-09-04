"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { createBudget } from "../actions";

const PLATFORMS = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "linkedin_ads", label: "LinkedIn Ads" },
  { value: "youtube_ads", label: "YouTube Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "other", label: "Otro" },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface Account {
  id: string;
  name: string;
  currency: string;
}

export function BudgetForm({ accounts }: { accounts: Account[] }) {
  const [state, formAction, pending] = useActionState(createBudget, undefined);
  const now = new Date();

  return (
    <>
      <Topbar
        crumbs={["AgencyHub", "Presupuestos", "Nuevo"]}
        monthLabel=""
      />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              PLAN MENSUAL
            </div>
            <h1 className="ah-page-title">
              Nuevo <span className="cm-thin">presupuesto</span>
              <span className="cm-dot" />
            </h1>
          </div>
        </div>

        <form
          action={formAction}
          style={{
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div className="ah-field">
            <label className="ah-field-label">Cuenta</label>
            <div className="ah-field-input">
              <select name="accountId" required>
                <option value="">Seleccionar cuenta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Plataforma</label>
            <div className="ah-field-input">
              <select name="platform" required>
                <option value="">Seleccionar plataforma</option>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="ah-field">
              <label className="ah-field-label">Mes</label>
              <div className="ah-field-input">
                <select name="month" defaultValue={now.getMonth() + 1}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ah-field">
              <label className="ah-field-label">Año</label>
              <div className="ah-field-input">
                <select name="year" defaultValue={now.getFullYear()}>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Monto planificado</label>
            <div className="ah-field-input">
              <input
                name="plannedAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 5000000"
                required
              />
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Moneda</label>
            <div className="ah-field-input">
              <select name="currency">
                <option value="CLP">CLP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Notas (opcional)</label>
            <div className="ah-field-input">
              <textarea name="notes" placeholder="Notas internas..." />
            </div>
          </div>

          {state?.error && <p className="ah-login-error">{state.error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="ah-btn" disabled={pending}>
              {pending ? "Creando…" : "Crear presupuesto"}
            </button>
            <Link href="/presupuestos" className="ah-btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
