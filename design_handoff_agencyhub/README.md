# Handoff · AgencyHub (Cluster Media)

## Overview

**AgencyHub** es una herramienta interna de Cluster Media para visualizar y controlar el gasto publicitario en Meta Ads y Google Ads, en todas las cuentas activas, sin depender de planillas. El producto reemplaza el control manual mensual con un panel centralizado, sincronización automática cada 4 horas, alarmas semánticas y reportes mensuales exportables.

**Usuarios:** equipo interno (~5–8 personas, dos roles: `admin` y `editor`). Sin registro público.
**Escala MVP:** ~15 cuentas, 2 plataformas, datos diarios.
**Stack sugerido (definido por el equipo):** FastAPI · PostgreSQL · React · TypeScript · Tailwind / vanilla CSS. El handoff no impone decisiones técnicas — sólo define la capa visual y de comportamiento.

---

## About the Design Files

Los archivos en `design_reference/` son **prototipos en HTML/JSX vanilla** creados como referencia visual y de comportamiento. **No son código de producción para copiar tal cual.** El uso de React + Babel inline es una conveniencia del prototipo; el equipo dev debe **recrear estas pantallas en el stack real del proyecto** (React + TS con build moderno, FastAPI sirviendo el backend), aplicando las convenciones de su codebase.

Lo que **sí** se debe respetar pixel-perfect:

- Tokens de color, tipografía, spacing y radius (definidos en `colors_and_type.css` + `app.css`).
- Layout, jerarquía visual, copywriting y microinteracciones de cada pantalla.
- Decisiones semánticas de color (cuándo usar `--ah-warn` vs `--ah-crit`, etc.).
- Tono editorial: eyebrows mono, headlines con palabra en `.cm-thin` italic púrpura + dot accent.

Lo que **se puede** reescribir libremente:

- Estructura de archivos / componentización en React.
- Manejo de estado (los demos usan `useState` local; en prod va a ser TanStack Query o similar).
- Datos: `data.js` es 100% mock — se reemplaza por llamadas reales al backend.

---

## Fidelity

**Alta fidelidad (hifi).** Las 8 pantallas tienen colores finales, tipografía final, spacing final y comportamiento de hover/active definido. La implementación debe ser pixel-perfect respecto a los archivos de referencia. Cualquier desviación (ej. cambiar tipografía a una del codebase) debe consultarse antes.

---

## Pantallas

Las 8 pantallas se renderizan apiladas verticalmente en `AgencyHub.html`. Cada una está envuelta en un componente `<BrowserChrome>` de utilería que **NO debe portarse** — es sólo presentación de mockup.

### 00 / Login (`login.jsx`)
- **Propósito:** acceso interno. No hay registro público.
- **Layout:** split 50/50. Izquierda editorial (fondo `--cm-bone`, halo púrpura difuso, headline display + eyebrow + crosshairs decorativos en esquinas). Derecha formulario centrado (max-width 380px).
- **Form:** email pre-llenado, password con botón "Mostrar", checkbox "mantener sesión", CTA primario pill negro.
- **Estados:** `idle`, `loading`, `error` (credenciales inválidas — mostrar inline arriba del form).

### 01 / Dashboard (`dashboard.jsx`)
- **Propósito:** punto de entrada. Plan vs real de todas las cuentas, ordenado por severidad.
- **KPI strip global:** Total planificado · Total gastado · Ritmo agregado · Alarmas activas.
- **Filtros:** chips horizontales por estado (`Todas`, `Críticas`, `Warning`, `OK`) — filtran la lista.
- **Lista:** una fila por cuenta. Cada fila contiene: barra vertical de color de cuenta (5px), nombre + currency badge mono, mini-barras horizontales por canal con marcador de "ritmo esperado" (línea púrpura vertical en el % donde debería estar al día actual), % de ejecución grande peso 200, badge de estado (`is-ok` / `is-warn` / `is-crit` / `is-low`).
- **Orden:** `crit > warn > low > ok`. Cuenta con `crit` lleva fondo `--ah-crit-soft` con gradiente lateral de 6px.

### 02 / Detalle de cuenta (`account-detail.jsx`)
- **Propósito:** drill-down a nivel cuenta. Demo siempre muestra **CHC** abril 2026 (día 22 de 30).
- **Header editorial:** eyebrow numerada `02 /`, headline ("CHC · *abril* 2026."), subhead.
- **KPI strip de 6:** Planificado · Gastado · Disponible · Días restantes · Gasto diario promedio · Ritmo (factor vs esperado).
- **Tabla plan-vs-real:** columnas Canal · Plan · Real · Δ · % ejecución · Ritmo (badge semáforo).
- **Gráfico SVG (`AccountChart`):** gasto acumulado eje Y (CLP), días 1–30 eje X. Tres líneas reales: meta (color brand), google (color brand), total (negro grueso). Una línea de plan ideal (lineal punteada gris). Línea vertical púrpura en "hoy" (día 22).
- **Tabla últimos 7 días:** fecha · meta · google · total · acumulado mes.

### 03 / Conexiones (`connections.jsx`)
- **Propósito:** gestión OAuth de Meta + Google por cuenta. **Solo admins.**
- **KPI strip:** Total conexiones · Sincronizando OK · Con error · Sin configurar.
- **Lista agrupada por cuenta:** cada grupo muestra las 2 plataformas (Meta, Google) con: estado (`ok` / `error` / `unset`), externalId enmascarado en mono, último sync, último error si aplica.
- **Form de re-autorización:** cuando una conexión está en `error` (ej. KIBO · Google), se expande inline con botones "Re-autorizar OAuth" + "Probar conexión" (resultado test inline con icono).
- **Acción global:** "Sincronizar todas ahora" en topbar.

### 04 / Presupuestos (`budgets.jsx`)
- **Propósito:** plan mensual por cuenta × plataforma. Restricción única: `(account_id, platform, month)`.
- **KPI strip:** Total CLP · Total USD · Δ vs mes anterior · Líneas configuradas (X / total esperado).
- **Tabla:** Cuenta (con barra de color) · Canal · Mes anterior · Δ% · Planificado abril · Notas · Acciones.
- **Edición inline:** click en "Editar" → la celda "Planificado" se vuelve input numérico, se muestran botones Guardar/Cancelar a la derecha. La fila se ilumina con fondo `--cm-bone`.
- **Atajo "Copiar de marzo":** form al pie con preview "Sobrescribirá las 12 líneas existentes" y CTA "Copiar y abrir editor".

### 05 / Alarmas (`alerts.jsx`)
- **Propósito:** bandeja de señales. Tres tipos: `overspend`, `low_budget`, `abnormal_pace`.
- **KPI strip:** Activas · Críticas · Sobregasto · Ritmo anormal.
- **Filtros:** chips `Activas` / `Críticas` / `Todas` con count.
- **Fila de alerta:** dot de severidad (con halo pulsante si no leída) · cuenta + plataforma + tipo · mensaje completo · umbral / actual · tiempo · acciones (marcar leída / descartar).
- **Estados visuales:** alerta no-leída tiene fondo `--ah-crit-soft` o `--ah-warn-soft` según severidad. Leídas: opacity 0.55.

### 06 / Reporte mensual (`reports.jsx`)
- **Propósito:** vista WYSIWYG del PDF exportable para cliente. Demo: CHC abril 2026.
- **Layout tipo "hoja"** con padding generoso (56/64), borde fino, fondo paper. Tres bloques:
  1. **Header:** marca Cluster + headline display "Reporte de gasto." + nombre cuenta + meta editorial.
  2. **Resumen ejecutivo:** prosa de 1 párrafo en peso 300 size 20px con números clave en `<strong>` 600. Debajo, grid 3-col con KPIs (Plan / Real al día 22 / Disponible) en peso 200 size 44.
  3. **Tabla por canal** + **Alertas del período** (bullets con dot semántico) + footer con fuente y timestamp.
- **Acciones:** "Exportar PDF" (primary) + "Exportar CSV" (ghost) en topbar.

### 07 / Usuarios (`users.jsx`)
- **Propósito:** gestión de equipo. **Solo admins.**
- **KPI strip:** Activos · Admins · Editores · Inactivos.
- **Tabla equipo:** avatar iniciales (32px) · nombre · email mono · rol (badge) · último acceso · estado · acción "Editar".
- **Bloque permisos por rol:** grid 2-col (Admin vs Editor) con matriz de capacidades por sección (Usuarios, Cuentas, Presupuestos, Conexiones, Sync manual, Alarmas).
- **Inactivos** se renderizan con `opacity: 0.55`.

---

## Componentes compartidos (`components.jsx`)

| Componente | Uso |
|---|---|
| `Sidebar({activeId})` | Nav lateral fijo 232px. Items: dashboard, budgets, connections, alerts, reports, users. Marca activo con barra izq + bg. Footer con avatar + email + sync timestamp. |
| `Topbar({crumbs, monthLabel, alerts, syncLabel})` | Barra superior con breadcrumbs, badge de mes activo, contador de alarmas (dot pulsante si > 0), CTA contextual. |
| `BrowserChrome` | **Solo para mockup**, no portar. |
| `StatusBadge({kind, children})` | Pill con borde y bg suave. `kind`: `ok` / `warn` / `crit` / `low` / `ghost`. |
| `ChannelMark({platform})` | Cuadradito 16px con letra (M, G, L, Y, T) representando la plataforma. |

---

## Design Tokens

### Color · Brand (de Cluster Media — `colors_and_type.css`)
```
--cm-accent:  #7866FA   /* Cluster Purple — único acento de marca, USO ESCASO */
--cm-ink:     #0B0B0F   /* texto principal */
--cm-ink-60:  #4A4A54   /* texto secundario */
--cm-ink-40:  #8B8B95   /* texto terciario / captions */
--cm-paper:   #FFFFFF   /* fondo principal */
--cm-bone:    #F5F4F1   /* fondo secundario / hover de filas */
--cm-rule:    #E7E6E2   /* divisorias */
```

### Color · Semánticos (específicos AgencyHub — `app.css`)
**Reservados solo para indicadores de estado en datos.** Nunca como acento decorativo.
```
--ah-ok:        #2E7D5B   /* verde bosque, no neón */
--ah-ok-soft:   #E8F1EC
--ah-warn:      #B7791F   /* ámbar tierra */
--ah-warn-soft: #FBF1DD
--ah-crit:      #B83A2A   /* terracota, no rojo bandera */
--ah-crit-soft: #F8E5E1
--ah-low:       #4A6FA5   /* azul polvo, "ritmo bajo" */
--ah-low-soft:  #E6ECF4
```

### Color · Identidad de cuentas (mock — el backend debe permitir picker)
```
CHC:      #E8553A    LINK USS:  #3A7BE8    VITEPAL:  #7866FA
NORVIAL:  #2EAD6B    KIBO:      #D4A04A    ATRIO:    #0B0B0F
```

### Tipografía
- **Sans:** `Manrope` (200/300/400/500/600/700/800) — Google Fonts.
- **Mono:** `JetBrains Mono` (400/500) — Google Fonts.
- **Reglas clave:**
  - Números siempre en mono con `font-variant-numeric: tabular-nums`.
  - Eyebrows: mono 11px, letter-spacing 0.14em, uppercase, color `--cm-ink-60`, prefijado por línea de 20×1px en `--cm-accent`.
  - Headlines de página: Manrope 800, letter-spacing -0.025em, una palabra clave en `.cm-thin` (peso 200, italic, color `--cm-accent`) + dot accent al final.
  - Display de KPIs grandes: peso 200, tracking -0.04em, line-height 1.

### Spacing
```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 120  (--cm-s-1 … --cm-s-10)
```

### Radius
```
--cm-r-sm:   4px      /* inputs, placeholders */
--cm-r-md:   14px     /* tarjetas flotantes, menús */
--cm-r-pill: 100px    /* CTAs, badges, chips */
```
Las **tablas, secciones grandes y rows NO tienen border-radius** — borde recto, estilo editorial.

### Shadows
```
--cm-shadow-sm: 0 4px 12px -6px rgba(11,11,15,.10)
--cm-shadow-md: 0 10px 30px -10px rgba(11,11,15,.18)
--cm-shadow-lg: 0 24px 60px -24px rgba(11,11,15,.24)
```

### Motion
```
--cm-ease-out: cubic-bezier(.2,.8,.2,1)
--cm-d-fast: 200ms        /* hovers, micro */
--cm-d-base: 250ms        /* transiciones de panel */
--cm-d-reveal: 800ms      /* aparición editorial */
```

---

## Datos · Modelo (mock en `data.js`, contrato esperado)

```ts
type Currency = "CLP" | "USD";
type Platform = "meta_ads" | "google_ads" | "linkedin_ads" | "youtube_ads" | "tiktok_ads";
type Status = "ok" | "warn" | "crit" | "low" | "unset" | "error";

type Account = {
  id: string;            // slug, ej "chc"
  name: string;          // corto, ej "CHC"
  fullName: string;      // ej "Clínica CHC"
  color: string;         // hex
  currency: Currency;
  channels: Channel[];
  alerts: number;
};

type Channel = {
  platform: Platform;
  planned: number;       // monto plan mensual
  spent: number;         // monto gastado al día actual
  lastSync: string;      // human-readable
  status: Status;
};

type Connection = {
  accountId: string;
  platform: Platform;
  externalId: string | null;
  status: "ok" | "error" | "unset";
  lastSync: string | null;
  lastError: string | null;
};

type Alert = {
  id: number;
  severity: "warn" | "crit";
  type: "overspend" | "low_budget" | "abnormal_pace";
  account: string;
  platform: Platform;
  message: string;
  threshold: string;
  current: string;
  time: string;
  read: boolean;
};

type User = {
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
  last: string;
  initials: string;
};
```

---

## Reglas de uso del color púrpura

El púrpura `--cm-accent` es **el único acento de marca**. Usarlo escasamente:

✅ **Sí:** una palabra en italic en headlines, dots accent al final de títulos, prefijo de línea en eyebrows, marcador de "ritmo esperado" en barras de progreso, línea vertical de "hoy" en gráficos, dot del logo, halo difuso en login.

❌ **No:** backgrounds sólidos grandes, CTAs primarios (esos son negros pill), badges semánticos, gradientes decorativos, iconos genéricos.

Los **estados semánticos** (ok / warn / crit / low) tienen sus propios colores tierra (`--ah-*`). **Nunca** mezclar el púrpura con semántica de datos — confundiría la lectura.

---

## Interacciones & comportamiento

### Sincronización
- Automática cada 4 horas (cron backend).
- Manual: botón "Sincronizar ahora" en topbar global y por cuenta. Trigger → spinner en topbar → toast de resultado.
- Sync con `error` deja la conexión en estado `error` y dispara alerta `crit` automática.

### Alarmas (lógica backend, evaluadas post-sync)
- **`overspend`:** dispara warn al 90% de ejecución, crit al 100%.
- **`low_budget`:** dispara warn cuando al ritmo actual quedan ≤ 5 días de cobertura, crit si ≤ 2.
- **`abnormal_pace`:** dispara warn si gasto diario > 1.5× promedio últimos 7 días, crit si > 2×.

### Edición de presupuestos
- Inline en tabla. Click "Editar" → row entra en modo edición. Guardar = PUT a backend, cerrar modo edición. Cancelar = revertir.
- Validación: monto > 0, integer.

### Estados de carga / error / vacío
- **Loading:** skeleton rows con shimmer (`--cm-bone` → bg-pulse). KPIs con dashes `—`.
- **Empty:** copy editorial, no ilustraciones genéricas. Ej. dashboard sin cuentas: eyebrow `00 /`, headline "Aún no hay cuentas configuradas." + CTA "Crear primera cuenta".
- **Error de fetch:** banner inline arriba del contenido con `--ah-crit-soft`, mensaje, botón "Reintentar".

### Permisos por rol
| Sección | Admin | Editor |
|---|---|---|
| Usuarios | CRUD | — |
| Cuentas | CRUD | Solo lectura |
| Presupuestos | CRUD | CRUD |
| Conexiones | CRUD + tokens | Solo lectura |
| Sync manual | Global y por cuenta | Por cuenta |
| Alarmas | Descartar | Marcar leídas |

UI: si editor entra a `/connections` o `/users`, mostrar 403 editorial (no redirect silencioso).

---

## Assets

- `assets/isotipo-transparente.webp` — isotipo Cluster Media. Usado en sidebar y login.
- **No hay otras imágenes.** Todos los iconos son SVG inline (lucide-style, stroke 2, viewBox 24).

---

## Files de referencia

```
design_reference/
├── AgencyHub.html              ← entry point que apila las 8 pantallas
├── colors_and_type.css         ← tokens Cluster Media (brand)
├── app.css                     ← tokens AgencyHub + estilos de componentes
├── data.js                     ← mock data (modelo + 6 cuentas + serie diaria + 7 alertas)
├── components.jsx              ← Sidebar, Topbar, StatusBadge, ChannelMark, BrowserChrome
├── login.jsx                   ← 00
├── dashboard.jsx               ← 01
├── account-detail.jsx          ← 02 (incluye AccountChart SVG)
├── connections.jsx             ← 03
├── budgets.jsx                 ← 04
├── alerts.jsx                  ← 05
├── reports.jsx                 ← 06
├── users.jsx                   ← 07
└── assets/
    └── isotipo-transparente.webp
```

Para previsualizar el bundle: abrir `AgencyHub.html` en cualquier navegador moderno. Las anclas a la derecha permiten saltar entre las 8 pantallas.

---

## Preguntas frecuentes para dev

1. **¿Tailwind o CSS vanilla?** El equipo decide. Si Tailwind, mapear los tokens a `tailwind.config.js`. Si vanilla, mantener los archivos `colors_and_type.css` + `app.css` con cambios mínimos.
2. **¿Internacionalización?** No en MVP. Todo en español Chile. Formato de moneda: `$X.XXX` (CLP, sin decimales) y `US$X,XXX` (USD).
3. **¿Dark mode?** Definido en tokens (`[data-theme="dark"]`) pero **no es prioridad MVP.** Prototipos están en light.
4. **¿Mobile?** No. App es desktop-first, breakpoint mínimo ~1280px. Sidebar fijo, no colapsa.
5. **¿Tests visuales?** Recomendado: Chromatic o Playwright snapshots de las 8 pantallas como referencia de regresión.
