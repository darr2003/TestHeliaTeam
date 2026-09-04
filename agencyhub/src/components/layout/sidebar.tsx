"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  href: string;
  /** Cuando esta presente, el item solo aparece si el modulo esta habilitado. */
  feature?: "spend";
}

const NAV_MAIN: NavItem[] = [
  { id: "clientes", label: "Clientes", href: "/cuentas" },
  { id: "competencia", label: "Competencia", href: "/competencia" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", feature: "spend" },
  { id: "presupuestos", label: "Presupuestos", href: "/presupuestos", feature: "spend" },
  { id: "conexiones", label: "Conexiones", href: "/conexiones", feature: "spend" },
  { id: "alarmas", label: "Alarmas", href: "/alarmas", feature: "spend" },
  { id: "reportes", label: "Reportes", href: "/reportes", feature: "spend" },
];

const NAV_ADMIN: NavItem[] = [
  { id: "usuarios", label: "Usuarios", href: "/usuarios" },
  { id: "tipo-cambio", label: "Tipo de cambio", href: "/tipo-cambio", feature: "spend" },
];

interface SidebarProps {
  userName?: string;
  userInitials?: string;
  userRole?: string;
  alertCount?: number;
  /** Flags habilitados. Llegan como props porque este es un client component. */
  features?: { spend: boolean };
}

export function Sidebar({
  userName = "Usuario",
  userInitials = "U",
  userRole = "editor",
  alertCount = 0,
  features = { spend: false },
}: SidebarProps) {
  const pathname = usePathname();

  const visible = (items: NavItem[]) =>
    items.filter((n) => !n.feature || features[n.feature]);

  const mainItems = visible(NAV_MAIN);
  const adminItems = visible(NAV_ADMIN);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="ah-sidebar">
      <div className="ah-brand">
        <Image src="/isotipo-transparente.webp" alt="" className="ah-brand-mark" width={22} height={22} />
        <span className="ah-brand-name">AgencyHub</span>
        <span className="ah-brand-sub">v0.1</span>
      </div>
      <nav className="ah-nav">
        <div className="ah-nav-label">Operaci&oacute;n</div>
        {mainItems.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className={`ah-nav-item ${isActive(n.href) ? "is-active" : ""}`}
          >
            <span>{n.label}</span>
            {n.id === "alarmas" && alertCount > 0 && (
              <span className="ah-nav-count is-crit">{alertCount}</span>
            )}
          </Link>
        ))}
        {userRole.toLowerCase() === "admin" && adminItems.length > 0 && (
          <>
            <div className="ah-nav-label" style={{ marginTop: 14 }}>
              Administraci&oacute;n
            </div>
            {adminItems.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className={`ah-nav-item ${isActive(n.href) ? "is-active" : ""}`}
              >
                <span>{n.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
      <div className="ah-sidebar-foot">
        <div className="ah-avatar">{userInitials}</div>
        <div>
          <div className="ah-user-name">{userName}</div>
          <div className="ah-user-role">{userRole} &middot; Cluster</div>
        </div>
      </div>
    </aside>
  );
}
