"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { createUser } from "../actions";

export default function NuevoUsuarioPage() {
  const [state, formAction, pending] = useActionState(createUser, undefined);

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Usuarios", "Nuevo"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              ADMINISTRACIÓN
            </div>
            <h1 className="ah-page-title">
              Nuevo <span className="cm-thin">usuario</span>
              <span className="cm-dot" />
            </h1>
          </div>
        </div>

        <form
          action={formAction}
          style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div className="ah-field">
            <label className="ah-field-label">Nombre completo</label>
            <div className="ah-field-input">
              <input name="name" placeholder="Ej: María Vergara" required />
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Correo electrónico</label>
            <div className="ah-field-input">
              <input
                name="email"
                type="email"
                placeholder="usuario@clustermedia.cl"
                required
              />
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Contraseña inicial</label>
            <div className="ah-field-input">
              <input
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="ah-field">
            <label className="ah-field-label">Rol</label>
            <div className="ah-field-input">
              <select name="role">
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {state?.error && <p className="ah-login-error">{state.error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="ah-btn" disabled={pending}>
              {pending ? "Creando…" : "Crear usuario"}
            </button>
            <Link href="/usuarios" className="ah-btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
