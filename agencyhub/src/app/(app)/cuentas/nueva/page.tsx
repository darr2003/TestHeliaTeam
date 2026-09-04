"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { createAccount } from "../actions";

const COLORS = [
  "#E53935", "#D81B60", "#8E24AA", "#5E35B1",
  "#3949AB", "#1E88E5", "#039BE5", "#00897B",
  "#43A047", "#7CB342", "#F4511E", "#6D4C41",
];

export default function NuevaCuentaPage() {
  const [state, formAction, pending] = useActionState(createAccount, undefined);

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Cuentas", "Nueva"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              GESTIÓN
            </div>
            <h1 className="ah-page-title">
              Nueva <span className="cm-thin">cuenta</span>
              <span className="cm-dot" />
            </h1>
          </div>
        </div>

        <form
          action={formAction}
          style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div className="ah-field">
            <label className="ah-field-label">Nombre de la cuenta</label>
            <div className="ah-field-input">
              <input name="name" placeholder="Ej: CHC, LINK USS" required />
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Moneda</label>
            <div className="ah-field-input">
              <select name="currency">
                <option value="CLP">CLP — Peso Chileno</option>
                <option value="USD">USD — Dólar</option>
              </select>
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Color identificador</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <label key={c} style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={c === COLORS[0]}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      background: c,
                      border: "2px solid transparent",
                      transition: "border-color 0.2s",
                    }}
                    className="ah-color-swatch"
                  />
                </label>
              ))}
            </div>
          </div>

          {state?.error && <p className="ah-login-error">{state.error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="ah-btn" disabled={pending}>
              {pending ? "Creando…" : "Crear cuenta"}
            </button>
            <Link href="/cuentas" className="ah-btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
