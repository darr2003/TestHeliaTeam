import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";
import { ToggleUserButton } from "./toggle-button";

export default async function UsuariosPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Usuarios"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              ADMINISTRACIÓN
            </div>
            <h1 className="ah-page-title">
              Usuarios<span className="cm-dot" />
            </h1>
          </div>
          <Link href="/usuarios/nuevo" className="ah-btn">
            Nuevo usuario
          </Link>
        </div>

        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último login</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <StatusBadge
                      kind={u.role === "admin" ? "low" : "ghost"}
                      label={u.role}
                    />
                  </td>
                  <td>
                    <StatusBadge
                      kind={u.isActive ? "ok" : "crit"}
                      label={u.isActive ? "Activo" : "Inactivo"}
                    />
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString("es-CL")
                      : "Nunca"}
                  </td>
                  <td className="num">
                    <ToggleUserButton userId={u.id} isActive={u.isActive} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                    No hay usuarios registrados.
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
