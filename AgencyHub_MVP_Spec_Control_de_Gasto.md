# AgencyHub MVP — Control de Gasto con Sync de Plataformas
## Especificación para Claude Code

**Versión:** 1.0
**Fecha:** 25 de abril de 2026
**Alcance:** MVP funcional centrado en visibilidad de gasto real vs planificado, con conexión automática a Meta Ads y Google Ads.

---

## 1. QUÉ ES ESTE MVP

Una app web interna para una agencia de marketing digital (~15 cuentas, 4-7 usuarios). El problema que resuelve: hoy no hay visibilidad centralizada de cuánto se está gastando en cada cuenta vs. lo planificado. Los datos están dispersos en Meta Ads Manager, Google Ads y planillas.

**Este MVP hace 5 cosas:**
1. Muestra las cuentas de la agencia y su presupuesto planificado por canal.
2. Se conecta a Meta Ads API y Google Ads API cada 4 horas (y on-demand) para traer el gasto real.
3. Compara plan vs real por cuenta y por canal.
4. Genera reportes de gasto.
5. Dispara alarmas cuando algo está fuera de rango.

**Lo que NO hace este MVP:** gestión de campañas, versionamiento de planes, tareas/kanban, acceso para clientes.

---

## 2. STACK TÉCNICO

| Componente | Tecnología sugerida |
|------------|-------------------|
| Frontend | React (Next.js preferido) |
| Backend / API | Next.js API routes o Express |
| Base de datos | PostgreSQL (Supabase o Railway) |
| Auth | NextAuth.js o Supabase Auth |
| Cron / Scheduler | Cron job en el server, o Supabase Edge Functions, o n8n |
| APIs externas | Meta Marketing API v21+, Google Ads API v17+ |
| Hosting | Vercel + Supabase (o Railway para todo) |

> El stack es sugerido. Lo importante es que funcione, persista datos y se pueda deployar.

---

## 3. MODELO DE DATOS

### `users`
```
id              UUID PK
name            string
email           string UNIQUE
password_hash   string
role            enum: admin, editor
is_active       boolean DEFAULT true
created_at      timestamp
```

### `accounts` (las "cuentas" = clientes de la agencia)
```
id              UUID PK
name            string          -- "CHC", "LINK USS", etc.
color           string          -- hex para UI, ej: "#E8553A"
currency        enum: CLP, USD
is_active       boolean DEFAULT true
created_at      timestamp
created_by      FK → users
```

### `platform_connections` (credenciales de cada cuenta en cada plataforma)
```
id              UUID PK
account_id      FK → accounts
platform        enum: meta_ads, google_ads
external_account_id  string     -- Meta Ad Account ID (act_XXXX) o Google Ads Customer ID (XXX-XXX-XXXX)
access_token    string ENCRYPTED -- token de acceso (Meta: long-lived token; Google: refresh token)
refresh_token   string ENCRYPTED / nullable -- solo Google Ads
token_expires_at timestamp / nullable
is_active       boolean DEFAULT true
last_sync_at    timestamp / nullable
last_sync_status enum: success, error, pending
last_sync_error  text / nullable
created_at      timestamp
```

> **Seguridad:** los tokens deben almacenarse encriptados. Usar variables de entorno para la clave de encriptación.

### `budget_plans` (presupuesto planificado por cuenta/mes/canal)
```
id              UUID PK
account_id      FK → accounts
platform        enum: meta_ads, google_ads, linkedin_ads, youtube_ads, tiktok_ads, other
month           integer (1-12)
year            integer
planned_amount  decimal         -- presupuesto planificado para ese canal ese mes
currency        enum: CLP, USD  -- heredado de account, pero explícito aquí
notes           text / nullable
created_at      timestamp
updated_at      timestamp
created_by      FK → users
```

**Restricción UNIQUE:** `(account_id, platform, month, year)` — un solo presupuesto por cuenta/plataforma/mes.

### `spend_records` (gasto real traído de las APIs)
```
id              UUID PK
account_id      FK → accounts
platform        enum: meta_ads, google_ads
date            date            -- día del gasto
amount_spent    decimal         -- gasto del día en moneda de la plataforma
currency        string          -- moneda original del gasto (USD, CLP, etc.)
amount_spent_local decimal      -- gasto convertido a moneda de la cuenta (si aplica)
impressions     bigint / nullable
clicks          integer / nullable
conversions     integer / nullable
source          enum: api_sync, manual
sync_batch_id   UUID / nullable -- referencia al batch de sync que trajo este dato
created_at      timestamp
updated_at      timestamp
```

**Restricción UNIQUE:** `(account_id, platform, date, source)` — un registro por cuenta/plataforma/día. Si se re-sincroniza, se actualiza (UPSERT).

### `sync_logs` (registro de cada sincronización)
```
id              UUID PK
platform_connection_id FK → platform_connections
sync_type       enum: scheduled, manual
status          enum: started, success, partial, error
records_synced  integer DEFAULT 0
error_message   text / nullable
started_at      timestamp
completed_at    timestamp / nullable
```

### `alerts` (alarmas generadas)
```
id              UUID PK
account_id      FK → accounts
platform        enum / nullable -- null = alerta a nivel de cuenta
alert_type      enum: overspend, low_budget, abnormal_pace
severity        enum: warning, critical
message         text
threshold_value decimal         -- el umbral que se cruzó (ej: 90%)
current_value   decimal         -- el valor actual (ej: 95%)
is_read         boolean DEFAULT false
is_dismissed    boolean DEFAULT false
created_at      timestamp
```

### Diagrama de relaciones
```
users
  └──→ accounts (created_by)
         ├──→ platform_connections (account_id)
         │      └──→ sync_logs (platform_connection_id)
         ├──→ budget_plans (account_id)
         ├──→ spend_records (account_id)
         └──→ alerts (account_id)
```

---

## 4. AUTENTICACIÓN

### 4.1 Login
- Email + password.
- Sin registro público — el admin crea usuarios.
- Sesión persistente (JWT o session cookie).

### 4.2 Roles
| Rol | Puede hacer |
|-----|------------|
| **Admin** | Todo: CRUD usuarios, cuentas, presupuestos, conexiones de plataforma, sync manual, dismissear alarmas |
| **Editor** | CRUD presupuestos, ver reportes, ver alarmas, sync manual. NO gestiona usuarios ni conexiones de plataforma |

---

## 5. FUNCIONALIDADES

### 5.1 Dashboard principal

Vista que muestra de un vistazo el estado de todas las cuentas en el mes actual.

**KPIs globales (parte superior):**
- Total presupuestado (mes actual, todas las cuentas)
- Total gastado (mes actual, todas las cuentas)
- % de ejecución global
- Cantidad de alertas activas

**Lista de cuentas (cards):**
Cada card muestra:
```
┌─────────────────────────────────────────────────────────┐
│ ● CHC                                    CLP    ⚠ 2    │
│                                                         │
│ Presupuesto: $3,500,000    Gastado: $3,200,000   91.4% │
│ ████████████████████████████████████░░░░                 │
│                                                         │
│ Meta Ads    $1,500,000  →  $1,420,000   94.7%  ✅       │
│ Google Ads  $2,000,000  →  $1,780,000   89.0%  ✅       │
│                                                         │
│ Última sync: hace 2 horas                               │
└─────────────────────────────────────────────────────────┘
```

- Barra de progreso con color según % de ejecución.
- Mini desglose por canal con indicador de estado.
- Indicador de última sincronización.
- Badge con cantidad de alertas activas.
- Click en la card lleva al detalle de la cuenta.

**Filtros:**
- Por mes/año (selector).
- Por estado de alarma (solo con alertas / todas).

### 5.2 Detalle de cuenta

Al hacer click en una cuenta, vista completa con:

#### 5.2.1 Header
- Nombre de cuenta + color.
- Mes/año seleccionado (navegable).
- Botón "Sincronizar ahora" (on-demand).
- Estado de última sync por plataforma.

#### 5.2.2 KPIs del mes
- Total planificado.
- Total gastado.
- Disponible (plan - gastado).
- % ejecución.
- Días transcurridos / días del mes.
- Ritmo de gasto (gasto diario promedio vs. gasto diario esperado).

#### 5.2.3 Tabla plan vs real por canal

| Canal | Planificado | Gastado | Disponible | % Ejec. | Ritmo | Estado |
|-------|-------------|---------|------------|---------|-------|--------|
| Meta Ads | $1,500,000 | $1,420,000 | $80,000 | 94.7% | Normal | ✅ |
| Google Ads | $2,000,000 | $1,780,000 | $220,000 | 89.0% | Normal | ✅ |
| **TOTAL** | **$3,500,000** | **$3,200,000** | **$300,000** | **91.4%** | | |

**Columna "Ritmo":**
Se calcula así:
```
dias_transcurridos = día actual del mes
dias_totales = días del mes
gasto_esperado_hoy = (planificado / dias_totales) * dias_transcurridos
ratio_ritmo = gastado / gasto_esperado_hoy
```
- ratio < 0.85 → "Bajo" (badge azul)
- ratio 0.85-1.15 → "Normal" (badge verde)
- ratio 1.15-1.30 → "Acelerado" (badge amarillo)
- ratio > 1.30 → "Crítico" (badge rojo)

**Columna "Estado" (semáforo):**
- ✅ Verde: ejecución < 90% O (ejecución >= 90% Y ritmo normal)
- ⚠️ Amarillo: ejecución 90-100% con ritmo acelerado
- 🔴 Rojo: ejecución > 100% O ritmo crítico

#### 5.2.4 Gráfico de gasto diario acumulado
- Eje X: días del mes (1-30/31).
- Línea 1: gasto acumulado real (de `spend_records`).
- Línea 2: gasto planificado lineal (línea recta de 0 al presupuesto total).
- Área sombreada entre ambas para visualizar desviación.
- Una línea por canal (colores distintos) + línea de total.

#### 5.2.5 Tabla de gasto diario
Tabla expandible con el detalle día a día:

| Fecha | Meta Ads | Google Ads | Total día | Acumulado |
|-------|----------|------------|-----------|-----------|
| 1 Abr | $48,000 | $62,000 | $110,000 | $110,000 |
| 2 Abr | $52,000 | $58,000 | $110,000 | $220,000 |
| ... | | | | |

### 5.3 Gestión de presupuestos

#### 5.3.1 Crear/editar presupuesto
- Seleccionar cuenta.
- Seleccionar mes/año.
- Agregar líneas por canal: plataforma + monto planificado.
- Edición inline.
- Validar que no exista duplicado (cuenta + plataforma + mes + año).

#### 5.3.2 Copiar presupuesto del mes anterior
- Botón "Copiar desde mes anterior" que trae las mismas líneas con los mismos montos.
- El usuario puede ajustar antes de guardar.

### 5.4 Conexiones de plataforma

Panel para configurar las conexiones API de cada cuenta.

#### 5.4.1 Meta Ads
- Campo: Ad Account ID (formato `act_XXXXXXXXX`).
- Campo: Access Token (long-lived user token o system user token).
- Botón "Probar conexión" que hace un call a la API y verifica acceso.
- La app necesita el Meta App ID y App Secret en variables de entorno.

**Endpoint para traer gasto:**
```
GET https://graph.facebook.com/v21.0/{ad_account_id}/insights
?fields=spend,impressions,clicks,actions
&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}
&time_increment=1
&level=account
&access_token={token}
```

El campo `spend` viene en la moneda de la cuenta de ads. El campo `actions` contiene conversiones (filtrar por `action_type` relevante).

#### 5.4.2 Google Ads
- Campo: Customer ID (formato `XXX-XXX-XXXX`, almacenar sin guiones).
- Campo: Refresh Token (obtenido via OAuth2 flow).
- La app necesita Google Ads Developer Token, OAuth Client ID y Client Secret en variables de entorno.
- También se necesita un Manager Account (MCC) ID si se accede a cuentas de terceros.

**Query GAQL para traer gasto:**
```sql
SELECT
  segments.date,
  metrics.cost_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions
FROM customer
WHERE segments.date BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'
```

El campo `cost_micros` viene en micros de la moneda de la cuenta (dividir por 1,000,000). 

#### 5.4.3 UI de conexiones
- Lista de cuentas con sus conexiones.
- Por cada conexión: plataforma, ID externo, estado (conectada/error/sin configurar), última sync.
- Solo el admin puede crear/editar conexiones.
- Los tokens se muestran ocultos (●●●●●) con opción de revelar.

### 5.5 Sincronización de gasto

#### 5.5.1 Sync automático (scheduled)
- Cada **4 horas** se ejecuta un job que:
  1. Recorre todas las `platform_connections` activas.
  2. Para cada una, consulta la API del mes actual (día 1 hasta hoy).
  3. Hace UPSERT en `spend_records` (actualiza si ya existe el registro del día).
  4. Registra el resultado en `sync_logs`.
  5. Evalúa las reglas de alarma (sección 5.6).

**Implementación del scheduler:**
- Opción A: Cron job en el servidor (node-cron o similar).
- Opción B: Supabase pg_cron o Edge Function con schedule.
- Opción C: Endpoint protegido + servicio externo (n8n, GitHub Actions, cron-job.org).

La opción C es la más fácil para un MVP: crear un endpoint `POST /api/sync/run` protegido con un API key, y llamarlo desde un cron externo.

#### 5.5.2 Sync manual (on-demand)
- Botón "Sincronizar ahora" en el detalle de cuenta.
- Sincroniza solo esa cuenta, todas sus plataformas conectadas.
- Muestra spinner durante el proceso y resultado al terminar.
- También un botón global "Sincronizar todas" en el dashboard (solo admin).

#### 5.5.3 Manejo de errores
- Si una API falla, registrar error en `sync_logs` y continuar con las demás.
- Actualizar `last_sync_status` en `platform_connections`.
- Si una conexión falla 3 veces consecutivas, generar una alerta tipo `connection_error`.
- Mostrar en el UI qué conexiones tienen error.

#### 5.5.4 Rango de sync
- Siempre sincronizar el **mes completo actual** (día 1 hasta hoy).
- Esto permite que datos de días anteriores se corrijan si la plataforma ajusta retroactivamente.
- Para el mes anterior: permitir re-sync manual los primeros 5 días del mes nuevo (Facebook puede demorar en consolidar).

### 5.6 Sistema de alarmas

#### 5.6.1 Tipos de alarma

**OVERSPEND — Gasto excede el plan**
```
Condición: (gastado / planificado) > umbral
Umbrales:
  - Warning:  gastado >= 90% del plan
  - Critical: gastado >= 100% del plan

Ejemplo: "CHC — Meta Ads ha gastado el 95% del presupuesto mensual ($1,425,000 de $1,500,000)"
```

**LOW_BUDGET — Queda poco presupuesto disponible**
```
Condición: (planificado - gastado) < umbral_absoluto
  O: días restantes > 0 AND (disponible / gasto_diario_promedio) < 3 días

Umbrales:
  - Warning:  quedan menos de 5 días de presupuesto al ritmo actual
  - Critical: quedan menos de 2 días de presupuesto al ritmo actual

Cálculo de días restantes de presupuesto:
  gasto_diario_promedio = gastado / dias_transcurridos
  dias_de_presupuesto = disponible / gasto_diario_promedio

Ejemplo: "LINK USS — Google Ads: al ritmo actual, el presupuesto se agota en ~2 días (quedan $95,000, gasto diario ~$48,000)"
```

**ABNORMAL_PACE — Ritmo de gasto anormal**
```
Condición: ratio_ritmo > 1.30 (gasta 30% más rápido de lo esperado)
  O: el gasto de un día supera 2x el gasto diario promedio de los últimos 7 días

Umbrales:
  - Warning:  ratio_ritmo > 1.30 O día > 1.5x promedio
  - Critical: ratio_ritmo > 1.50 O día > 2.0x promedio

Ejemplo: "VITEPAL — Meta Ads: gasto del día ($120,000) es 2.3x el promedio diario ($52,000). Verificar campañas."
```

#### 5.6.2 Evaluación de alarmas
- Se ejecuta **después de cada sync** (automático y manual).
- Se evalúan las 3 reglas para cada combinación cuenta + plataforma que tenga presupuesto y gasto.
- Si una alarma del mismo tipo ya existe y no ha sido dismissed, no se crea duplicado — se actualiza el `current_value`.
- Si la condición deja de cumplirse, la alarma se marca como resuelta automáticamente (o simplemente no se muestra).

#### 5.6.3 UI de alarmas

**Indicador global en el header:**
- Badge con cantidad de alarmas no leídas.
- Click abre un panel/dropdown con lista de alarmas.

**Cada alarma muestra:**
- Icono de severidad (⚠ warning amarillo, 🔴 critical rojo).
- Cuenta + plataforma.
- Mensaje descriptivo.
- Hace cuánto se generó.
- Botón "Marcar como leída".
- Botón "Descartar" (dismiss — no vuelve a mostrarse esa alarma hasta que las condiciones cambien significativamente).

**En el dashboard:**
- Cada card de cuenta muestra badge con cantidad de alarmas activas.
- Las cuentas con alarmas critical aparecen primero (o con borde rojo).

#### 5.6.4 Configuración de umbrales (fase posterior)
Para el MVP, los umbrales están hardcodeados:
```
OVERSPEND_WARNING = 0.90   (90%)
OVERSPEND_CRITICAL = 1.00  (100%)
LOW_BUDGET_WARNING_DAYS = 5
LOW_BUDGET_CRITICAL_DAYS = 2
PACE_WARNING_RATIO = 1.30
PACE_CRITICAL_RATIO = 1.50
PACE_WARNING_SPIKE = 1.5
PACE_CRITICAL_SPIKE = 2.0
```

En una fase posterior se pueden hacer configurables por cuenta.

### 5.7 Reporte de gasto

#### 5.7.1 Vista de reporte mensual
Pantalla que muestra un resumen consolidado del mes, pensado para reportar internamente o al cliente.

**Contenido del reporte:**
```
REPORTE DE GASTO — [CUENTA] — [MES AÑO]

Resumen ejecutivo:
- Presupuesto total: $X
- Gasto total: $X (XX.X%)
- Disponible: $X

Por canal:
| Canal       | Plan        | Real        | Δ          | % Ejec |
|-------------|-------------|-------------|------------|--------|
| Meta Ads    | $1,500,000  | $1,420,000  | -$80,000   | 94.7%  |
| Google Ads  | $2,000,000  | $1,780,000  | -$220,000  | 89.0%  |
| TOTAL       | $3,500,000  | $3,200,000  | -$300,000  | 91.4%  |

Alertas del período:
- ⚠ Meta Ads alcanzó 95% del presupuesto el día 22.
```

#### 5.7.2 Exportación
- Botón "Exportar" que genera un PDF simple con el resumen.
- Alternativa: exportar como CSV con los datos diarios por canal.

---

## 6. INTERFAZ Y UX — DESIGN SYSTEM DE LA AGENCIA

### 6.1 Fuente de verdad: Claude Design

La agencia tiene un **design system completo** creado en Claude Design que incluye:
- Tokens de diseño (colores, tipografía, spacing, radii, shadows).
- Componentes completos (botones, inputs, cards, tablas, badges, barras de progreso, modales, etc.).
- Pantallas y layouts de referencia.

**INSTRUCCIÓN CRÍTICA PARA CLAUDE CODE:**

Antes de escribir cualquier componente de frontend, se debe:
1. Importar el design system usando el handoff de Claude Design.
2. Configurar los tokens como variables CSS / Tailwind config / theme provider (según el framework).
3. Construir TODOS los componentes del sistema usando exclusivamente los tokens y componentes del design system.
4. NO inventar colores, fuentes, espaciados o estilos propios — todo debe venir del design system.

Esto aplica desde la Fase 1 — el primer `<button>` que se renderice debe usar el design system.

### 6.2 Proceso de integración

```
Paso 0: Handoff desde Claude Design
  └─→ Exportar tokens (CSS variables, Tailwind config, o JSON)
  └─→ Exportar componentes base (si los genera como código)
  └─→ Copiar assets (logo, iconos, fuentes)

Paso 1: Setup en el proyecto
  └─→ Crear archivo de theme/tokens (ej: tailwind.config.js, theme.ts, globals.css)
  └─→ Instalar fuentes requeridas por el design system
  └─→ Crear componentes UI base reutilizables (Button, Input, Card, Table, Badge, Modal, etc.)

Paso 2: Validar
  └─→ Crear una página de demo con todos los componentes para verificar que matchean el design system
  └─→ Verificar en distintos tamaños de pantalla
```

### 6.3 Mapeo de componentes del design system a funcionalidades

El design system debe proveer al menos estos componentes para cubrir las funcionalidades del MVP:

| Componente | Se usa en |
|-----------|-----------|
| Card | Dashboard (card por cuenta), detalle de conexiones |
| Table | Plan vs Real, gasto diario, presupuestos |
| Badge / Tag | Estados (warning, critical, ok), plataformas, roles |
| Progress Bar | % de ejecución por cuenta y canal |
| Input / Select | Formularios de presupuesto, conexiones, usuarios |
| Modal / Dialog | Crear cuenta, crear presupuesto, confirmar acciones |
| Button | Primario, secundario, destructivo, ghost |
| Alert / Toast | Notificaciones de sync, errores, confirmaciones |
| Chart (line) | Gasto acumulado diario |
| KPI Card / Stat | Métricas resumen en dashboard y detalle |
| Sidebar / Nav | Navegación principal |
| Dropdown / Menu | Alertas, acciones por fila |
| Spinner / Loader | Durante sync y carga de datos |
| Empty State | Cuando no hay datos (sin cuentas, sin presupuesto, sin gasto) |

> Si algún componente no existe en el design system, crearlo siguiendo los tokens y patrones visuales existentes — nunca inventar un estilo nuevo.

### 6.4 Navegación

Sidebar con las siguientes secciones:
- **Dashboard** (vista principal con todas las cuentas)
- **Presupuestos** (gestión de budget plans)
- **Conexiones** (configuración de APIs — solo admin)
- **Alarmas** (historial de alarmas)
- **Usuarios** (solo admin)

### 6.5 Responsive
- Optimizado para desktop.
- Usable en tablet.
- Mobile no es prioridad.

---

## 7. VARIABLES DE ENTORNO REQUERIDAS

```env
# Base de datos
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
# o NEXTAUTH_SECRET si se usa NextAuth

# Encriptación de tokens
ENCRYPTION_KEY=...        # Para encriptar tokens de API almacenados en DB

# Meta Ads
META_APP_ID=...
META_APP_SECRET=...

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID=...  # MCC ID si aplica

# Sync
SYNC_API_KEY=...          # API key para proteger el endpoint de sync externo
SYNC_INTERVAL_HOURS=4     # Frecuencia de sync automático
```

---

## 8. DATOS SEED

### Usuarios
| Email | Password | Rol |
|-------|----------|-----|
| admin@agencia.cl | admin123 | admin |
| editor@agencia.cl | editor123 | editor |

### Cuentas (datos de ejemplo para testing — no son los clientes reales)
| Nombre | Color | Moneda |
|--------|-------|--------|
| Cliente Demo 1 | #E8553A | CLP |
| Cliente Demo 2 | #3A7BE8 | CLP |
| Cliente Demo 3 | #2EAD6B | USD |

> Los clientes reales se crearán directamente en el sistema una vez deployado. Estos datos son solo para que el desarrollo tenga data con la cual testear.

### Presupuestos de ejemplo (Abril 2026)
**Cliente Demo 1:**
- Meta Ads: $1,500,000 CLP
- Google Ads: $2,000,000 CLP

**Cliente Demo 2:**
- Meta Ads: $1,200,000 CLP
- Google Ads: $750,000 CLP

**Cliente Demo 3:**
- Meta Ads: $5,000 USD
- Google Ads: $3,000 USD

> Las conexiones de plataforma (`platform_connections`) NO se crean en el seed — se configuran manualmente con tokens reales después del deploy.

---

## 9. ENDPOINTS API (REFERENCIA)

### Auth
```
POST /api/auth/login          { email, password } → { token, user }
GET  /api/auth/me             → { user }
```

### Accounts
```
GET    /api/accounts           → [accounts]
POST   /api/accounts           { name, color, currency }
PUT    /api/accounts/:id       { name, color, currency, is_active }
DELETE /api/accounts/:id       (soft delete: is_active = false)
```

**Comportamiento del soft delete de cuentas:**
- La cuenta se marca como `is_active = false`.
- Deja de aparecer en el dashboard, selectores y listados.
- Todos los datos asociados se mantienen intactos (presupuestos, gasto, conexiones, alarmas, sync_logs).
- Las conexiones de plataforma de esa cuenta se desactivan automáticamente (dejan de sincronizar).
- El admin puede ver cuentas inactivas en un filtro "Mostrar inactivas" y reactivarlas si es necesario.
```

### Budget Plans
```
GET    /api/budgets?account_id=&month=&year=    → [budgets]
POST   /api/budgets            { account_id, platform, month, year, planned_amount }
PUT    /api/budgets/:id        { planned_amount, notes }
DELETE /api/budgets/:id
POST   /api/budgets/copy       { account_id, from_month, from_year, to_month, to_year }
```

### Platform Connections
```
GET    /api/connections?account_id=             → [connections]
POST   /api/connections        { account_id, platform, external_account_id, access_token, refresh_token }
PUT    /api/connections/:id    { access_token, refresh_token, is_active }
POST   /api/connections/:id/test               → { success, message }
DELETE /api/connections/:id
```

### Sync
```
POST /api/sync/run             → sync all active connections (protected by SYNC_API_KEY)
POST /api/sync/account/:id     → sync specific account (auth required)
GET  /api/sync/logs?connection_id=&limit=      → [sync_logs]
```

### Spend Records
```
GET  /api/spend?account_id=&month=&year=       → [spend_records by day]
GET  /api/spend/summary?account_id=&month=&year= → { totals by platform }
POST /api/spend                { manual entry } → spend_record (source=manual)
```

### Alerts
```
GET   /api/alerts?is_read=false                → [active alerts]
PUT   /api/alerts/:id/read                     → mark as read
PUT   /api/alerts/:id/dismiss                  → dismiss
GET   /api/alerts/count                        → { unread_count }
```

### Reports
```
GET /api/reports/monthly?account_id=&month=&year=  → { report data }
GET /api/reports/monthly/pdf?account_id=&month=&year= → PDF file
GET /api/reports/monthly/csv?account_id=&month=&year= → CSV file
```

---

## 10. LÓGICA DE SYNC — PSEUDOCÓDIGO

```
function syncConnection(connection):
    log = createSyncLog(connection, "started")
    
    try:
        startDate = firstDayOfCurrentMonth()
        endDate = today()
        
        if connection.platform == "meta_ads":
            data = callMetaInsightsAPI(
                account_id = connection.external_account_id,
                token = decrypt(connection.access_token),
                since = startDate,
                until = endDate,
                time_increment = 1  // daily breakdown
            )
            for each day in data:
                upsertSpendRecord(
                    account_id = connection.account_id,
                    platform = "meta_ads",
                    date = day.date,
                    amount_spent = day.spend,
                    impressions = day.impressions,
                    clicks = day.clicks,
                    conversions = day.actions.count("offsite_conversion"),
                    source = "api_sync",
                    sync_batch_id = log.id
                )
        
        if connection.platform == "google_ads":
            data = callGoogleAdsAPI(
                customer_id = connection.external_account_id,
                developer_token = env.GOOGLE_ADS_DEVELOPER_TOKEN,
                refresh_token = decrypt(connection.refresh_token),
                query = GAQL_QUERY,
                date_range = [startDate, endDate]
            )
            for each row in data:
                upsertSpendRecord(
                    account_id = connection.account_id,
                    platform = "google_ads",
                    date = row.date,
                    amount_spent = row.cost_micros / 1_000_000,
                    impressions = row.impressions,
                    clicks = row.clicks,
                    conversions = row.conversions,
                    source = "api_sync",
                    sync_batch_id = log.id
                )
        
        updateSyncLog(log, "success", records_count)
        updateConnection(connection, last_sync_at = now(), last_sync_status = "success")
        
        // Evaluar alarmas después de sync exitoso
        evaluateAlerts(connection.account_id)
    
    catch error:
        updateSyncLog(log, "error", error.message)
        updateConnection(connection, last_sync_status = "error", last_sync_error = error.message)
        
        // Si falló 3+ veces seguidas, crear alerta de conexión
        if consecutiveErrors(connection) >= 3:
            createAlert(connection.account_id, "connection_error", "critical")


function evaluateAlerts(account_id):
    budgets = getBudgetPlans(account_id, currentMonth, currentYear)
    
    for each budget in budgets:
        totalSpent = sumSpendRecords(account_id, budget.platform, currentMonth, currentYear)
        planned = budget.planned_amount
        
        // OVERSPEND
        ratio = totalSpent / planned
        if ratio >= 1.00:
            upsertAlert(account_id, budget.platform, "overspend", "critical", ratio)
        elif ratio >= 0.90:
            upsertAlert(account_id, budget.platform, "overspend", "warning", ratio)
        
        // LOW_BUDGET
        daysElapsed = dayOfMonth(today())
        dailyAvg = totalSpent / daysElapsed
        daysOfBudgetLeft = (planned - totalSpent) / dailyAvg if dailyAvg > 0
        if daysOfBudgetLeft < 2:
            upsertAlert(account_id, budget.platform, "low_budget", "critical", daysOfBudgetLeft)
        elif daysOfBudgetLeft < 5:
            upsertAlert(account_id, budget.platform, "low_budget", "warning", daysOfBudgetLeft)
        
        // ABNORMAL_PACE
        expectedSpend = (planned / daysInMonth()) * daysElapsed
        paceRatio = totalSpent / expectedSpend if expectedSpend > 0
        todaySpend = getSpendForDate(account_id, budget.platform, today())
        last7DayAvg = getAvgSpend(account_id, budget.platform, last7Days)
        spikeRatio = todaySpend / last7DayAvg if last7DayAvg > 0
        
        if paceRatio > 1.50 or spikeRatio > 2.0:
            upsertAlert(account_id, budget.platform, "abnormal_pace", "critical", max(paceRatio, spikeRatio))
        elif paceRatio > 1.30 or spikeRatio > 1.5:
            upsertAlert(account_id, budget.platform, "abnormal_pace", "warning", max(paceRatio, spikeRatio))
```

---

## 11. CRITERIOS DE ACEPTACIÓN

El MVP está completo cuando:

1. ✅ Todos los componentes de UI usan exclusivamente los tokens y componentes del design system de la agencia (importado desde Claude Design).
2. ✅ Un usuario puede hacer login con email/password.
2. ✅ El admin puede crear y gestionar usuarios.
3. ✅ Se pueden crear y listar cuentas con color y moneda.
4. ✅ Se pueden cargar presupuestos mensuales por cuenta y canal.
5. ✅ Se pueden copiar presupuestos del mes anterior.
6. ✅ Se pueden configurar conexiones a Meta Ads y Google Ads por cuenta.
7. ✅ El botón "Probar conexión" verifica acceso a la API.
8. ✅ La sincronización automática corre cada 4 horas y trae gasto diario.
9. ✅ La sincronización manual funciona por cuenta y global.
10. ✅ El dashboard muestra plan vs real por cuenta y por canal con barra de progreso.
11. ✅ El detalle de cuenta muestra la tabla plan vs real con semáforo y ritmo de gasto.
12. ✅ El gráfico de gasto acumulado diario funciona.
13. ✅ Las alarmas se generan automáticamente después de cada sync (overspend, low_budget, abnormal_pace).
14. ✅ Las alarmas se muestran en el UI con badge, se pueden marcar como leídas y descartar.
15. ✅ El reporte mensual se puede exportar como PDF o CSV.
16. ✅ Los tokens de API se almacenan encriptados.
17. ✅ Los sync_logs registran cada sincronización con estado y errores.

---

## 12. FASES DE DESARROLLO SUGERIDAS

**Fase 0 — Design System (PRIMERO, antes de todo):**
Importar el design system desde Claude Design (handoff). Configurar tokens (colores, tipografía, spacing) en el proyecto. Construir la librería de componentes UI base (Button, Input, Card, Table, Badge, Modal, ProgressBar, KPICard, Sidebar, etc.). Validar con una página de demo que todos los componentes se vean correctos. NADA de funcionalidad todavía — solo la base visual.

**Fase 1 — Fundación:**
Auth (login, roles), CRUD de usuarios, CRUD de cuentas, CRUD de presupuestos, dashboard básico sin datos reales. Todo usando los componentes de la Fase 0.

**Fase 2 — Conexiones y sync:**
Platform connections, integración Meta Ads API, integración Google Ads API, sync manual, sync_logs.

**Fase 3 — Plan vs Real:**
Dashboard con datos reales, tabla comparativa, gráfico de gasto acumulado, cálculo de ritmo.

**Fase 4 — Alarmas y reportes:**
Evaluación de alarmas post-sync, UI de alarmas, reporte mensual, export PDF/CSV.

**Fase 5 — Sync automático:**
Scheduler cada 4 horas, manejo de errores de conexión, re-sync mes anterior.
