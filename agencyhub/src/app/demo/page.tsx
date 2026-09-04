"use client";

import { useState } from "react";
import {
  Button,
  StatusBadge,
  ChannelMark,
  ProgressBar,
  KPI,
  KPIStrip,
  Eyebrow,
  PageHead,
  ThinAccent,
  DotAccent,
  Modal,
  Chip,
  FilterBar,
  Spinner,
  Skeleton,
  Input,
  Select,
  Textarea,
  SectionHead,
  Table,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface DemoRow {
  channel: string;
  platform: "meta_ads" | "google_ads";
  planned: string;
  spent: string;
  exec: string;
  pace: "ok" | "warn";
  status: "ok" | "warn";
  paceLabel: string;
  statusLabel: string;
}

const demoRows: DemoRow[] = [
  { channel: "Meta Ads", platform: "meta_ads", planned: "$1.500.000", spent: "$1.425.000", exec: "95.0%", pace: "warn", paceLabel: "Acelerado", status: "warn", statusLabel: "Atención" },
  { channel: "Google Ads", platform: "google_ads", planned: "$2.000.000", spent: "$1.780.000", exec: "89.0%", pace: "ok", paceLabel: "Normal", status: "ok", statusLabel: "Normal" },
];

const demoColumns: Column<DemoRow>[] = [
  { key: "channel", header: "Canal", render: (r) => <span className="ah-table-channel"><ChannelMark platform={r.platform} />{r.channel}</span> },
  { key: "planned", header: "Planificado", numeric: true, render: (r) => r.planned },
  { key: "spent", header: "Gastado", numeric: true, render: (r) => r.spent },
  { key: "exec", header: "% Ejec.", numeric: true, render: (r) => <strong>{r.exec}</strong> },
  { key: "pace", header: "Ritmo", render: (r) => <StatusBadge kind={r.pace}>{r.paceLabel}</StatusBadge> },
  { key: "status", header: "Estado", render: (r) => <StatusBadge kind={r.status}>{r.statusLabel}</StatusBadge> },
];

const demoTotalRow: Record<string, React.ReactNode> = {
  channel: "Total cuenta",
  planned: "$3.500.000",
  spent: "$3.205.000",
  exec: "91.6%",
};

export default function DemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeChip, setActiveChip] = useState("todas");

  return (
    <div className="ah-app">
      <Sidebar
        userName="M. Vergara"
        userInitials="MV"
        userRole="admin"
        alertCount={7}
        features={{ spend: true }}
      />
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "DEMO"]}
          monthLabel="ABR · 2026"
          alertCount={7}
          syncLabel="Sincronizar todas"
          showAlerts
          showSync
        />
        <div className="ah-content">
          {/* Page head */}
          <PageHead
            eyebrow="00 / DESIGN SYSTEM"
            title={
              <>
                Componentes <ThinAccent>base</ThinAccent>
                <DotAccent />
              </>
            }
            subtitle="Todos los componentes del design system de Cluster Media, validados contra los prototipos del handoff."
          />

          {/* Buttons */}
          <div className="ah-section">
            <SectionHead title="Botones" meta="Primary · Ghost · Icon" />
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Button>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Primary Button
              </Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="icon" aria-label="Acciones">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </Button>
              <Button disabled>Disabled</Button>
              <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="ah-section">
            <SectionHead title="Status Badges" meta="5 variantes" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatusBadge kind="ok">Normal</StatusBadge>
              <StatusBadge kind="warn">Atenci&oacute;n</StatusBadge>
              <StatusBadge kind="crit">Cr&iacute;tico</StatusBadge>
              <StatusBadge kind="low">Subgasto</StatusBadge>
              <StatusBadge kind="ghost">Ghost</StatusBadge>
            </div>
          </div>

          {/* Channel Marks */}
          <div className="ah-section">
            <SectionHead title="Channel Marks" meta="Plataformas publicitarias" />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <ChannelMark platform="meta_ads" />
              <ChannelMark platform="google_ads" />
              <ChannelMark platform="linkedin_ads" />
              <ChannelMark platform="youtube_ads" />
              <ChannelMark platform="tiktok_ads" />
              <ChannelMark platform="other" />
            </div>
          </div>

          {/* Progress Bars */}
          <div className="ah-section">
            <SectionHead title="Progress Bars" meta="Con pace marker púrpura" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 500 }}>
              <div>
                <span style={{ fontSize: 12, color: "var(--cm-ink-60)", marginBottom: 4, display: "block" }}>
                  Normal (60%) — pace marker al 73%
                </span>
                <ProgressBar ratio={0.6} status="ok" paceMarker={0.73} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--cm-ink-60)", marginBottom: 4, display: "block" }}>
                  Warning (92%)
                </span>
                <ProgressBar ratio={0.92} status="warn" paceMarker={0.73} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--cm-ink-60)", marginBottom: 4, display: "block" }}>
                  Cr&iacute;tico (104%)
                </span>
                <ProgressBar ratio={1.04} status="crit" paceMarker={0.73} />
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="ah-section">
            <SectionHead title="KPI Strip" meta="4 columnas" />
            <KPIStrip>
              <KPI
                label="Presupuesto · CLP"
                value="$9.0"
                unit="M"
                footer={<span>6 cuentas activas</span>}
              />
              <KPI
                label="Gastado al d&iacute;a 22"
                value="$7.8"
                unit="M"
                footer={<span className="ah-kpi-delta">86.7% ejecuci&oacute;n global</span>}
              />
              <KPI
                label="Ritmo agencia"
                value="1.18"
                unit="&times;"
                footer={<StatusBadge kind="warn">Acelerado</StatusBadge>}
              />
              <KPI
                label="Alarmas activas"
                value="7"
                valueColor="var(--ah-crit)"
                footer={
                  <>
                    <span style={{ color: "var(--ah-crit)" }}>2 cr&iacute;ticas</span>
                    <span>&middot;</span>
                    <span style={{ color: "var(--ah-warn)" }}>5 warning</span>
                  </>
                }
              />
            </KPIStrip>
          </div>

          {/* KPI Strip 6 columns */}
          <div className="ah-section">
            <SectionHead title="KPI Strip — 6 columnas" meta="Detalle de cuenta" />
            <KPIStrip columns={6}>
              <KPI label="Planificado" value="$3.5" unit="M" footer={<span>2 canales</span>} />
              <KPI label="Gastado" value="$3.2" unit="M" footer={<span>91.4% ejecuci&oacute;n</span>} />
              <KPI label="Disponible" value="$300" unit="K" footer={<span>quedan 8 d&iacute;as</span>} />
              <KPI label="D&iacute;as" value="22" unit="/ 30" unitColor="var(--cm-ink-40)" footer={<span>73% del mes</span>} />
              <KPI label="Gasto diario prom." value="$145" unit="K" footer={<span>esperado: $117K</span>} />
              <KPI label="Ritmo" value="1.25" unit="&times;" footer={<StatusBadge kind="warn">Acelerado</StatusBadge>} />
            </KPIStrip>
          </div>

          {/* Filter Chips */}
          <div className="ah-section">
            <SectionHead title="Filter Chips" />
            <FilterBar>
              <Chip active={activeChip === "todas"} count={6} onClick={() => setActiveChip("todas")}>
                Todas
              </Chip>
              <Chip active={activeChip === "alertas"} count={4} onClick={() => setActiveChip("alertas")}>
                Con alarmas
              </Chip>
              <Chip active={activeChip === "criticas"} count={2} onClick={() => setActiveChip("criticas")}>
                Cr&iacute;ticas
              </Chip>
            </FilterBar>
          </div>

          {/* Table */}
          <div className="ah-section">
            <SectionHead title="Tabla" meta="Plan vs real" />
            <Table<DemoRow>
              columns={demoColumns}
              data={demoRows}
              rowKey={(r) => r.platform}
              totalRow={demoTotalRow}
            />
          </div>

          {/* Form fields */}
          <div className="ah-section">
            <SectionHead title="Form Fields" meta="Input · Select · Textarea" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 600 }}>
              <Input label="Correo electrónico" type="email" placeholder="tu@clustermedia.cl" />
              <Input label="Contraseña" type="password" defaultValue="••••••••••••" />
              <Select label="Moneda">
                <option value="CLP">CLP</option>
                <option value="USD">USD</option>
              </Select>
              <Input label="Con error" type="text" error="Este campo es requerido" />
              <Textarea label="Notas" placeholder="Escribe una nota..." help="Máximo 500 caracteres" />
            </div>
          </div>

          {/* Eyebrow */}
          <div className="ah-section">
            <SectionHead title="Eyebrow" />
            <Eyebrow>CONTROL DE GASTO &middot; INTERNO</Eyebrow>
          </div>

          {/* Spinner & Skeleton */}
          <div className="ah-section">
            <SectionHead title="Loading states" />
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Spinner />
              <Spinner size={24} />
              <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton height={14} width="80%" />
                <Skeleton height={36} />
                <Skeleton height={14} width="60%" />
              </div>
            </div>
          </div>

          {/* Mini status dots */}
          <div className="ah-section">
            <SectionHead title="Mini Status Dots" />
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ah-mini-status" /> OK
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ah-mini-status is-warn" /> Warning
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ah-mini-status is-crit" /> Critical
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ah-mini-status is-low" /> Low
              </span>
            </div>
          </div>

          {/* Account row preview */}
          <div className="ah-section">
            <SectionHead title="Account Row (Dashboard)" meta="Preview" />
            <div className="ah-account-list">
              <div className="ah-account-row is-warn">
                <div className="ah-account-id">
                  <div className="ah-account-swatch" style={{ background: "#E8553A" }} />
                  <div>
                    <span className="ah-account-name">CHC</span>
                    <span className="ah-account-meta">CLP &middot; Cl&iacute;nica CHC</span>
                  </div>
                </div>
                <div className="ah-account-channels">
                  <div className="ah-channel-line">
                    <span className="ah-channel-name">
                      <span className="ah-mini-status is-warn" style={{ display: "inline-block", marginRight: 6 }} />
                      Meta Ads
                    </span>
                    <div><ProgressBar ratio={0.95} status="warn" paceMarker={0.73} /></div>
                    <span className="ah-channel-amount">$1.425.000</span>
                  </div>
                  <div className="ah-channel-line">
                    <span className="ah-channel-name">
                      <span className="ah-mini-status" style={{ display: "inline-block", marginRight: 6 }} />
                      Google Ads
                    </span>
                    <div><ProgressBar ratio={0.89} status="ok" paceMarker={0.73} /></div>
                    <span className="ah-channel-amount">$1.780.000</span>
                  </div>
                </div>
                <div className="ah-account-summary">
                  <span className="ah-account-pct is-warn tabnum">
                    91.6<span className="ah-pct-unit">%</span>
                  </span>
                  <span className="ah-account-totals">$3.205.000 / $3.500.000</span>
                </div>
                <div className="ah-account-status">
                  <StatusBadge kind="warn">Atenci&oacute;n</StatusBadge>
                  <span className="ah-account-totals">2 alarmas</span>
                </div>
              </div>
              <div className="ah-account-row">
                <div className="ah-account-id">
                  <div className="ah-account-swatch" style={{ background: "#2EAD6B" }} />
                  <div>
                    <span className="ah-account-name">NORVIAL</span>
                    <span className="ah-account-meta">CLP &middot; Norvial Concesiones</span>
                  </div>
                </div>
                <div className="ah-account-channels">
                  <div className="ah-channel-line">
                    <span className="ah-channel-name">
                      <span className="ah-mini-status" style={{ display: "inline-block", marginRight: 6 }} />
                      Meta Ads
                    </span>
                    <div><ProgressBar ratio={0.62} status="ok" paceMarker={0.73} /></div>
                    <span className="ah-channel-amount">$280.000</span>
                  </div>
                  <div className="ah-channel-line">
                    <span className="ah-channel-name">
                      <span className="ah-mini-status" style={{ display: "inline-block", marginRight: 6 }} />
                      Google Ads
                    </span>
                    <div><ProgressBar ratio={0.72} status="ok" paceMarker={0.73} /></div>
                    <span className="ah-channel-amount">$470.000</span>
                  </div>
                </div>
                <div className="ah-account-summary">
                  <span className="ah-account-pct tabnum">
                    68.2<span className="ah-pct-unit">%</span>
                  </span>
                  <span className="ah-account-totals">$750.000 / $1.100.000</span>
                </div>
                <div className="ah-account-status">
                  <StatusBadge kind="ok">Normal</StatusBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear cuenta"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModalOpen(false)}>Guardar</Button>
          </>
        }
      >
        <Input label="Nombre de la cuenta" type="text" placeholder="Ej: CHC, LINK USS" />
        <Input label="Moneda" type="text" defaultValue="CLP" />
        <Input label="Color" type="text" defaultValue="#E8553A" />
      </Modal>
    </div>
  );
}
