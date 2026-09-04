# AgencyHub MVP — Plan de Desarrollo Definitivo

**Fecha:** 26 de abril de 2026
**Stack:** Next.js 14+ (App Router) · Supabase (PostgreSQL + Auth) · TypeScript · Tailwind CSS · Vercel

---

## Decisiones de arquitectura

### Stack confirmado
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 14+ App Router | Full-stack en 1 codebase, API routes integradas |
| Base de datos | Supabase PostgreSQL | Managed, incluye auth, realtime, edge functions |
| Auth | Supabase Auth | Email/password, sessions, RLS listo |
| ORM | Prisma | Type-safe, migrations, seed, introspection |
| Estilos | Tailwind CSS | Tokens del design system mapeados a config |
| Charts | Recharts o SVG manual | El prototipo ya usa SVG manual, replicar |
| PDF | @react-pdf/renderer | Genera PDF nativo sin headless browser |
| Hosting | Vercel | Deploy automático desde git, cron jobs integrados |
| Encriptación tokens | AES-256-GCM | Via `crypto` nativo de Node.js, key en env var |

### Estructura del proyecto
```
agencyhub/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (app)/              # Layout con sidebar + topbar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── accounts/[id]/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── connections/page.tsx
│   │   │   ├── alerts/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── users/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── accounts/
│   │   │   ├── budgets/
│   │   │   ├── connections/
│   │   │   ├── sync/
│   │   │   ├── spend/
│   │   │   ├── alerts/
│   │   │   └── reports/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Design system base
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   ├── kpi-strip.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── channel-mark.tsx
│   │   │   ├── chip.tsx
│   │   │   └── spinner.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   └── features/           # Componentes específicos por feature
│   │       ├── account-row.tsx
│   │       ├── spend-chart.tsx
│   │       ├── alert-row.tsx
│   │       └── report-document.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── encryption.ts       # AES-256-GCM para tokens
│   │   ├── sync/
│   │   │   ├── meta-ads.ts
│   │   │   ├── google-ads.ts
│   │   │   └── engine.ts       # Orquestador de sync
│   │   ├── alerts/
│   │   │   └── evaluator.ts    # Motor de alarmas
│   │   ├── formatters.ts       # fmtCLP, fmtUSD, fmtPct
│   │   └── constants.ts        # Umbrales de alarmas, enums
│   └── types/
│       └── index.ts
├── public/
│   └── isotipo-transparente.webp
├── tailwind.config.ts
├── .env.local.example
└── package.json
```

---

## Correcciones al modelo de datos

### Tabla nueva: `exchange_rates`
```
id              UUID PK
from_currency   enum: USD
to_currency     enum: CLP
month           integer (1-12)
year            integer
rate            decimal         -- ej: 950.00 (1 USD = 950 CLP)
created_at      timestamp
updated_at      timestamp
created_by      FK → users
```
**Restricción UNIQUE:** `(from_currency, to_currency, month, year)`

Se usa para convertir gasto USD a CLP en los KPIs globales del dashboard. El admin define el tipo de cambio manualmente por mes.

### Campos agregados a tablas existentes

**`users`:**
- `last_login_at  timestamp / nullable` — para mostrar "Último acceso" en la UI

**`accounts`:**
- `updated_at  timestamp` — para auditoría

**`alerts.alert_type`:**
- Agregar `connection_error` al enum — generada cuando una conexión falla 3+ veces consecutivas

### Comportamiento de monedas en el dashboard

- **KPIs globales:** se muestran DOS secciones: "Total CLP" y "Total USD"
- **Ritmo agencia:** se calcula por moneda separada
- **Si se necesita un total unificado:** se usa el `exchange_rate` del mes para convertir USD→CLP y sumar
- **Formato:** CLP sin decimales ($1.500.000), USD con 2 decimales (US$5,000.00)

---

## Fases de desarrollo

### Fase 0 — Scaffolding + Design System (~3-4 días)

**Objetivo:** proyecto corriendo y deployado con todos los componentes UI base validados.

#### 0.1 Scaffolding
- [ ] Init Next.js 14 con App Router + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Configurar Supabase (proyecto, DB, auth)
- [ ] Configurar Prisma (schema, conexión a Supabase)
- [ ] Crear .env.local.example con todas las variables
- [ ] Deploy inicial a Vercel (vacío pero funcionando)
- [ ] Configurar git + .gitignore

#### 0.2 Design tokens
- [ ] Mapear `colors_and_type.css` → `tailwind.config.ts` (extend theme)
- [ ] Mapear `app.css` variables semánticas → CSS custom properties en `globals.css`
- [ ] Instalar fuentes: Manrope + JetBrains Mono (Google Fonts via next/font)
- [ ] Definir spacing scale, radius, shadows en Tailwind config

#### 0.3 Componentes UI base
Cada componente debe replicar pixel-perfect los prototipos del handoff:
- [ ] `Button` (primary pill negro, ghost, icon-button)
- [ ] `Input` (con label mono, help text, field-input wrapper)
- [ ] `StatusBadge` (ok, warn, crit, low, ghost)
- [ ] `ChannelMark` (cuadrado 22px con letra M/G/L/Y/T)
- [ ] `ProgressBar` (con fill por status + pace marker púrpura)
- [ ] `KPIStrip` + `KPICard` (label mono, value thin 44px, foot)
- [ ] `Table` (header mono, rows, total row, num alignment)
- [ ] `Badge` / `Chip` (filter chips con count)
- [ ] `Modal` (overlay + card, animación)
- [ ] `Spinner` / Loading skeleton
- [ ] `Eyebrow` (línea púrpura + texto mono uppercase)
- [ ] `PageHead` (eyebrow + title con cm-thin + cm-dot + subtitle)
- [ ] `SectionHead` (title + meta right-aligned)

#### 0.4 Layout
- [ ] `Sidebar` (232px fijo, nav items, brand, user footer)
- [ ] `Topbar` (breadcrumbs, period pill, alert icon, CTA)
- [ ] `AppLayout` (grid sidebar + main)

#### 0.5 Validación
- [ ] Página `/demo` con todos los componentes renderizados
- [ ] Verificar match visual contra `AgencyHub.html` en browser
- [ ] Verificar fuentes, colores, spacing, radius, shadows

**Entregable:** app deployada en Vercel con `/demo` mostrando todos los componentes.

---

### Fase 1 — Auth + CRUD (~4-5 días)

**Objetivo:** sistema de login funcional, gestión de usuarios/cuentas/presupuestos.

#### 1.1 Auth
- [ ] Configurar Supabase Auth (email/password)
- [ ] Página de login (`/login`) con diseño del prototipo (split 50/50)
- [ ] Middleware de protección de rutas
- [ ] Gestión de sesión (mantener sesión iniciada)
- [ ] Redirección post-login al dashboard
- [ ] Metadata de usuario en Supabase (role: admin/editor)

#### 1.2 CRUD Usuarios (admin only)
- [ ] Tabla de usuarios (`/users`) con diseño del prototipo
- [ ] Modal crear usuario (nombre, email, password, rol)
- [ ] Modal editar usuario (cambiar rol, desactivar)
- [ ] Admin puede resetear password de otro usuario
- [ ] Protección: editor ve 403 editorial en `/users`
- [ ] Actualizar `last_login_at` en cada login

#### 1.3 CRUD Cuentas
- [ ] API routes: GET, POST, PUT, DELETE (soft delete)
- [ ] Modal crear cuenta (nombre, color picker, moneda CLP/USD)
- [ ] Modal editar cuenta
- [ ] Soft delete (is_active = false, desactiva conexiones)
- [ ] Filtro "Mostrar inactivas" para admin

#### 1.4 CRUD Presupuestos
- [ ] Página `/budgets` con diseño del prototipo
- [ ] Tabla de líneas por cuenta × plataforma
- [ ] Edición inline (click Editar → input → Guardar/Cancelar)
- [ ] Modal nueva línea de presupuesto
- [ ] Copiar presupuesto del mes anterior (con preview)
- [ ] Validación: unique (account_id, platform, month, year)
- [ ] KPI strip: totales CLP, totales USD, vs mes anterior, líneas configuradas

#### 1.5 Tipo de cambio
- [ ] Sección en settings o en la página de presupuestos para definir exchange rate mensual
- [ ] API: GET/PUT exchange_rates por mes/año
- [ ] Default: si no hay rate definido, mostrar warning

#### 1.6 Navegación
- [ ] Sidebar funcional con navegación entre páginas
- [ ] Topbar con breadcrumbs dinámicos
- [ ] Period pill (selector mes/año) funcional
- [ ] Badge de alarmas (hardcoded 0 por ahora)

#### 1.7 Seed data
- [ ] Script de seed con: 2 usuarios (admin + editor), 6 cuentas de ejemplo, presupuestos abril 2026, exchange rate abril 2026
- [ ] Ejecutable con `npx prisma db seed`

**Entregable:** login funcional, CRUD completo de usuarios/cuentas/presupuestos, navegación funcionando.

---

### Fase 2 — Dashboard + Vistas con datos seed (~4-5 días)

**Objetivo:** todas las pantallas de visualización funcionando con datos calculados de la DB.

#### 2.1 Dashboard
- [ ] KPIs globales (presupuestado, gastado, ritmo, alarmas) — calculados de budget_plans + spend_records
- [ ] Lista de cuentas con: swatch color, barras de progreso por canal, %, status badge
- [ ] Sorting por estado (crit > warn > low > ok)
- [ ] Filtros por chips (Todas, Con alarmas, Críticas)
- [ ] Pace marker púrpura en barras (% esperado al día actual)
- [ ] Fila con gradiente lateral para cuentas crit/warn
- [ ] Click en cuenta → navega a detalle

#### 2.2 Detalle de cuenta
- [ ] Header editorial (eyebrow, título, meta con conexiones/sync)
- [ ] KPI strip de 6 (planificado, gastado, disponible, días, gasto diario, ritmo)
- [ ] Tabla plan vs real por canal (con StatusBadge de ritmo y estado)
- [ ] Cálculo de ritmo: ratio gasto actual vs gasto esperado lineal
- [ ] Gráfico SVG de gasto acumulado (total + por canal + plan lineal + línea "hoy")
- [ ] Tabla últimos 7 días (meta, google, total, acumulado, % del plan)
- [ ] Botón "Ver mes completo" para expandir tabla

#### 2.3 Vista de reportes
- [ ] Diseño WYSIWYG del reporte mensual (tipo "hoja")
- [ ] Header con marca Cluster + headline + cuenta
- [ ] Resumen ejecutivo (párrafo + KPIs 3-col)
- [ ] Tabla por canal
- [ ] Alertas del período
- [ ] Footer con fuente y timestamp
- [ ] Exportar CSV (descarga directa)
- [ ] Selector de cuenta + mes en topbar

#### 2.4 Datos seed para visualización
- [ ] Generar spend_records de ejemplo para abril 2026 (22 días, 6 cuentas)
- [ ] Lógica de cálculo de status por canal (ok/warn/crit/low) en el backend
- [ ] Formatters de moneda (CLP: $1.500.000, USD: US$5,000)

**Entregable:** dashboard completo y detalle de cuenta funcionando con datos seed. Reporte mensual visible y exportable como CSV.

---

### Fase 3 — Conexiones API + Sync (~5-7 días)

**Objetivo:** conexión real a Meta Ads y Google Ads, sincronización de gasto.

#### 3.1 Platform connections
- [ ] Página `/connections` con diseño del prototipo
- [ ] Lista agrupada por cuenta (status ok/error/unset)
- [ ] Form de conexión inline (Customer ID, tokens)
- [ ] Encriptación AES-256-GCM de tokens antes de guardar
- [ ] Tokens mostrados como ●●●●● con botón "Mostrar"
- [ ] Solo admin puede crear/editar
- [ ] KPI strip: total, sincronizando, con error, sin configurar

#### 3.2 Meta Ads API
- [ ] Llamar `GET /v21.0/{ad_account_id}/insights` con parámetros de la spec
- [ ] Parsear respuesta: spend, impressions, clicks, actions
- [ ] UPSERT en spend_records por día
- [ ] Manejo de errores (token expirado, rate limit, account not found)
- [ ] "Test connection" que valida acceso a la cuenta

#### 3.3 Google Ads API
- [ ] Configurar Google Ads API client (google-ads-api npm)
- [ ] Query GAQL para obtener cost_micros, impressions, clicks, conversions
- [ ] Convertir cost_micros / 1,000,000
- [ ] UPSERT en spend_records por día
- [ ] Manejo de errores (refresh token inválido, customer ID incorrecto)
- [ ] "Test connection"
- [ ] Verificar status del developer token

#### 3.4 Motor de sync
- [ ] `POST /api/sync/account/:id` — sync manual de una cuenta
- [ ] `POST /api/sync/run` — sync global (protegido por SYNC_API_KEY)
- [ ] Recorrer todas las platform_connections activas
- [ ] Sincronizar mes completo (día 1 → hoy)
- [ ] Registrar sync_logs (started, success, partial, error)
- [ ] Actualizar last_sync_at y last_sync_status en platform_connections
- [ ] Spinner + feedback en UI durante sync manual

#### 3.5 Dashboard con datos reales
- [ ] Reemplazar datos seed con queries reales a spend_records
- [ ] Verificar que plan vs real funciona end-to-end
- [ ] Formato de moneda correcto según cuenta

**Entregable:** conexiones configurables, sync manual funcionando, dashboard con datos reales de Meta/Google.

---

### Fase 4 — Alarmas + PDF + Scheduler (~3-4 días)

**Objetivo:** alarmas automáticas, exportación PDF, sync programado.

#### 4.1 Motor de alarmas
- [ ] Función `evaluateAlerts(accountId)` con lógica de la spec
- [ ] OVERSPEND: warn 90%, critical 100%
- [ ] LOW_BUDGET: warn ≤5 días, critical ≤2 días
- [ ] ABNORMAL_PACE: warn ratio >1.30 o spike >1.5x, critical >1.50 o >2.0x
- [ ] CONNECTION_ERROR: critical cuando 3+ fallos consecutivos
- [ ] UPSERT de alarmas (no duplicar, actualizar current_value)
- [ ] Resolución automática cuando condición deja de cumplirse
- [ ] Se ejecuta después de cada sync (manual y automático)

#### 4.2 UI de alarmas
- [ ] Página `/alerts` con diseño del prototipo
- [ ] KPI strip: activas, críticas, sobregasto, ritmo anormal
- [ ] Filtros: Activas, Críticas, Todas (con counts)
- [ ] Fila de alerta: dot severidad (pulsante si no leída), cuenta, plataforma, tipo, mensaje, umbral/actual, tiempo
- [ ] Background crit-soft/warn-soft para no leídas, opacity 0.55 para leídas
- [ ] Botón marcar como leída / descartar
- [ ] Badge de alarmas en topbar (dot badge rojo)
- [ ] Badge de alarmas en cards del dashboard

#### 4.3 Exportación PDF
- [ ] Implementar con @react-pdf/renderer
- [ ] Replicar diseño WYSIWYG del reporte
- [ ] Endpoint `GET /api/reports/monthly/pdf?account_id=&month=&year=`
- [ ] Descarga directa desde botón "Exportar PDF"

#### 4.4 Scheduler
- [ ] Vercel Cron job cada 4 horas → `POST /api/sync/run`
- [ ] Configurar en `vercel.json` con cron expression
- [ ] Protección del endpoint con SYNC_API_KEY
- [ ] Re-sync mes anterior los primeros 5 días del mes nuevo
- [ ] Manejo de errores consecutivos (3+ → alerta connection_error)
- [ ] Logging completo en sync_logs

**Entregable:** alarmas funcionando end-to-end, PDF exportable, sync automático cada 4h.

---

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase PostgreSQL connection string)
DATABASE_URL=

# Encriptación de tokens de API
ENCRYPTION_KEY=                    # 32 bytes hex para AES-256-GCM

# Meta Ads
META_APP_ID=
META_APP_SECRET=

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=     # MCC ID

# Sync
SYNC_API_KEY=                      # Protege el endpoint de sync externo
CRON_SECRET=                       # Vercel Cron secret
```

---

## Criterios de "done" por fase

| Fase | Criterio |
|------|----------|
| 0 | App deployada en Vercel, `/demo` muestra todos los componentes, match visual con prototipos |
| 1 | Login funcional, CRUD completo, navegación, seed data cargada |
| 2 | Dashboard y detalle de cuenta muestran datos seed, CSV exportable |
| 3 | Sync manual trae datos reales de Meta/Google, dashboard actualizado |
| 4 | Alarmas post-sync, PDF exportable, cron cada 4h funcionando |

---

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Google Ads developer token no aprobado | Bloquea sync Google | Verificar estado ASAP; si no está, usar test account o mockear |
| Meta tokens expiran (60 días) | Sync se detiene | Documentar proceso de re-obtención; alerta connection_error |
| Rate limits de APIs | Sync parcial | Implementar retry con exponential backoff |
| Supabase free tier limits | Performance | Monitorear; upgrade si necesario (Pro es $25/mes) |
