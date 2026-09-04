"use client";

import { useActionState } from "react";
import { upsertExchangeRate } from "./actions";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function ExchangeRateForm({ year }: { year: number }) {
  const [state, formAction, pending] = useActionState(
    upsertExchangeRate,
    undefined
  );
  const now = new Date();

  return (
    <div className="ah-section">
      <div className="ah-section-head">
        <h2 className="ah-section-title">Actualizar tipo de cambio</h2>
      </div>
      <form
        action={formAction}
        style={{
          maxWidth: 400,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
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
        <input type="hidden" name="year" value={year} />
        <div className="ah-field">
          <label className="ah-field-label">CLP por 1 USD</label>
          <div className="ah-field-input">
            <input
              name="rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 920.50"
              required
            />
          </div>
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
          <button type="submit" className="ah-btn" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
          {state?.success && (
            <span
              style={{
                fontFamily: "var(--cm-mono)",
                fontSize: 11,
                color: "var(--ah-ok)",
              }}
            >
              Guardado correctamente
            </span>
          )}
          {state?.error && (
            <span
              style={{
                fontFamily: "var(--cm-mono)",
                fontSize: 11,
                color: "var(--ah-crit)",
              }}
            >
              {state.error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
