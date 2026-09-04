"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="ah-login">
      {/* Left — editorial */}
      <div className="ah-login-left">
        <div className="ah-login-halo" />
        <div className="ah-login-crosshair" style={{ top: 32, left: 32 }} />
        <div className="ah-login-crosshair" style={{ top: 32, right: 32 }} />

        <div className="ah-login-brand">
          <Image
            src="/isotipo-transparente.webp"
            alt=""
            width={24}
            height={24}
          />
          <span className="ah-login-brand-name">AgencyHub</span>
          <span className="ah-login-brand-meta">STGO · CL · 2026</span>
        </div>

        <div style={{ position: "relative" }}>
          <div className="ah-eyebrow" style={{ marginBottom: 24 }}>
            <span className="ah-eyebrow-line" />
            CONTROL DE GASTO · INTERNO
          </div>
          <h1 className="ah-login-headline">
            Plan vs{" "}
            <span className="cm-thin">real</span>, sin planillas
            <span className="cm-dot" />
          </h1>
          <p className="ah-login-desc">
            Visibilidad centralizada de gasto en Meta Ads y Google Ads, todas
            las cuentas. Sync cada 4 horas, alarmas automáticas, reportes
            mensuales.
          </p>
        </div>

        <div className="ah-login-stats">
          <span>15 cuentas</span>
          <span>·</span>
          <span>2 plataformas</span>
          <span>·</span>
          <span>Sync 4 h</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="ah-login-right">
        <div className="ah-login-form-wrap">
          <div className="ah-eyebrow" style={{ marginBottom: 18 }}>
            <span className="ah-eyebrow-line" />
            ACCESO · CLUSTER MEDIA
          </div>
          <h2 className="ah-login-title">Iniciar sesión.</h2>
          <p className="ah-login-subtitle">
            Sin registro público. Si necesitas acceso, pídeselo a tu
            administrador.
          </p>

          <form action={formAction} className="ah-login-form">
            <div className="ah-field">
              <label className="ah-field-label">Correo electrónico</label>
              <div className="ah-field-input">
                <input
                  name="email"
                  type="email"
                  placeholder="tu@clustermedia.cl"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="ah-field">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label className="ah-field-label">Contraseña</label>
              </div>
              <div className="ah-field-input">
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}>
                  {showPw ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {state?.error && (
              <p className="ah-login-error">{state.error}</p>
            )}

            <button
              type="submit"
              className="ah-btn"
              disabled={pending}
              style={{
                justifyContent: "center",
                padding: "16px 26px",
                marginTop: 8,
              }}
            >
              {pending ? "Entrando…" : "Entrar"}
              {!pending && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </form>

          <div className="ah-login-footer">
            <span>v0.1 · MVP</span>
            <span>contacto@clustermedia.cl</span>
          </div>
        </div>
      </div>
    </div>
  );
}
