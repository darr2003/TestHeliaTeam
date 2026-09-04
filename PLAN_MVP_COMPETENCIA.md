# AgencyHub — MVP de Análisis de Competencia

**Fecha:** 17 de agosto de 2026
**Reemplaza como prioridad a:** [`PLAN_DESARROLLO.md`](./PLAN_DESARROLLO.md) (que sigue vigente como referencia del módulo de gasto)

---

## 1. Cambio de alcance

El objetivo del proyecto no cambia: AgencyHub sigue apuntando a centralizar campañas, gasto y alarmas. Lo que cambia es **qué se deja arriba primero**.

El MVP que sale a producción contiene solo tres cosas:

| Módulo | Estado del código hoy | Trabajo pendiente |
|---|---|---|
| **Login + gestión de usuarios** | ✅ construido | Ninguno funcional |
| **Cuentas + ficha de cliente** | 🟡 CRUD construido, ficha no existe | Agregar campos de ficha y su UI |
| **Análisis de competencia** | ❌ no existe | Todo — es la prioridad |

Los módulos de **gasto, presupuestos, conexiones y alarmas** quedan construidos pero **ocultos tras feature flag**. No se borran: el código está probado y `tsc` pasa limpio. Se prenden cuando las conexiones a Meta y Google estén validadas.

---

## 2. Arquitectura: Cloudflare con Postgres intacto

**Decisión:** compute, cron y storage en Cloudflare, pero la base de datos sigue siendo el Supabase Postgres actual, accedido vía **Hyperdrive**.

```
FRONTEND + API    Cloudflare Workers (@opennextjs/cloudflare)
BASE DE DATOS     Supabase Postgres  ← vía Hyperdrive
AUTH              Supabase Auth (sin cambios)
INFORMES          R2
CRON              Cloudflare Cron Triggers
```

**Por qué no D1:** D1 es SQLite. El schema actual usa enums nativos de Postgres, `Decimal(15,2)`, `BigInt` y `@db.Uuid`. Migrar a D1 obliga a reescribir el schema completo, las migraciones, el seed y toda la aritmética de montos. Con una fecha corta encima, no se justifica. Hyperdrive conserva el schema Prisma, los cálculos de plata y Supabase Auth tal como están.

### 2.1 Riesgos verificados

### ⚠️ VERIFICADO 18-ago-2026: el riesgo se materializó

**`proxy.ts` no puede correr sobre OpenNext/Workers.** Se probó empíricamente contra Next 16.2.12, `@opennextjs/cloudflare` 1.20.2 y wrangler 4.124.0 — o sea, versiones muy posteriores a las del issue. El build falla con `Node.js middleware is not currently supported`. Sin `proxy.ts`, el mismo build completa y la app arranca en workerd (`/login` → 200).

**No se arregla esperando una versión.** OpenNext sugiere migrar a Edge Middleware, y eso es inaplicable en Next 16: la doc oficial dice que el `runtime` config option no está disponible en archivos Proxy y que setearlo tira error. En Next 16 el middleware es Node y punto. Para ir a Workers hay que **borrar** `proxy.ts`.

**La mitigación anticipada se confirmó sólida.** `src/app/(app)/layout.tsx` llama a `requireAuth()`, así que las rutas siguen protegidas sin proxy. Lo que se pierde es solo el refresh de cookie, que hoy ocurre únicamente en `proxy.ts` porque el client de Server Component descarta los writes en un `catch {}`.

**Riesgo nuevo, no contemplado acá: Prisma no arranca en workerd.** La afirmación de más abajo ("Prisma funciona sobre Hyperdrive") es cierta pero incompleta — el engine actual no encuentra su query engine en Workers (HTTP 500 verificado). Migrar exige `@prisma/adapter-pg`, `previewFeatures` en el schema y reescribir `src/lib/prisma.ts`.

**Consecuencia para el plan:** irse a Cloudflare son dos reformas, no "una tarde". El MVP sigue en Vercel. La config quedó commiteada como exploración no adoptada en la rama `exploracion/cloudflare-workers`; el detalle está en `agencyhub/docs/cloudflare-workers.md`.

**Lo que sí está confirmado como compatible:**
- `@opennextjs/cloudflare` soporta todas las minor y patch de Next.js 16.
- Requiere el flag `nodejs_compat` y `compatibility_date` ≥ 2024-09-23.
- Prisma funciona sobre Hyperdrive contra Postgres.
- Hyperdrive contra Supabase exige la **connection string directa**, no la pooled. En este proyecto eso es `DIRECT_URL`, no `DATABASE_URL` (que apunta a pgbouncer). Hyperdrive hace el pooling, así que pgbouncer sale del camino.
- Supabase Auth vía `@supabase/ssr` sigue funcionando: usa la API HTTP de Auth, no la conexión Postgres, y eso no lo toca Hyperdrive.

---

## 3. El agente vive aparte

**Decisión:** el agente de análisis de competencia **no se consolida** en este repo. AgencyHub es únicamente **consumidor** del informe.

Razón: el agente va a iterar rápido en prompts, fuentes y formato de salida. Acoplarlo a la app significa que cada experimento del agente arriesga el login. Cadencias distintas, modos de falla distintos, repos distintos.

Fuentes que el agente usa (fuera del alcance de este repo): Meta Ad Library, Ahrefs / Ubersuggest, y scraping de sitios y redes de competidores.

### 3.1 Contrato de entrega: el agente hace POST

```
AGENTE
  │  POST /api/informes/ingest
  │  Authorization: Bearer INGEST_API_KEY
  │  { cliente, fecha, tipo, markdown }
  ▼
AGENCYHUB Worker
  ├── valida frontmatter, fecha y que el cliente exista
  ├── escribe R2:  informes/{cliente}/{fecha}-{tipo}.md
  └── UPSERT en la tabla de índice
```

El agente **no necesita credenciales de R2** — un solo secreto compartido. AgencyHub valida en la puerta y es dueño de su índice, así que un informe mal nombrado se rechaza con error en vez de volverse invisible.

### 3.2 Listas: quien es dueno de que

**Corregido el 18-ago-2026.** Lo que decia antes esta seccion —que AgencyHub es fuente de verdad de clientes y competidores, y que el agente los consulta antes de cada corrida— **no es lo que ocurre**. El reparto real:

**Clientes: la misma lista en ambos mundos, mantenida a mano.** Por ahora se sostiene manualmente en los dos lados. El unico acople duro es que el campo `cliente` del frontmatter coincida con el nombre de la cuenta en AgencyHub, o la ingesta responde 404 indicando donde consultar los nombres validos.

**Competidores: manda el agente.** El listado que alimenta el informe vive en el modulo externo, junto con el prompt, el modelo y las instrucciones. Los competidores de la ficha de cliente en AgencyHub son **informativos**: describen al cliente, no definen el informe.

**Se espera divergencia, y es legitima.** De 10 competidores cargados en la ficha, el informe puede enfocarse en 5. Eso no es un error de sincronizacion y no hay que "arreglarlo".

`GET /api/clientes/activos` sigue existiendo y devuelve ambas cosas. Al agente le sirve para alinear los **nombres de cliente**, que es donde el 404 duele; el campo `competidores` puede ignorarlo.

```
GET /api/clientes/activos
Authorization: Bearer INGEST_API_KEY
→ { clientes: [{ cliente, sitio_web, industria, competidores: [...] }] }
```

**Hacia donde puede ir.** La gestion completa de clientes podria vivir enteramente en AgencyHub mas adelante. Por ahora es independiente, y asi arranca el MVP1.

### 3.3 Formato del informe

Markdown con **frontmatter mínimo obligatorio** y cuerpo libre. El agente puede cambiar secciones, agregar tablas o quitar gráficos sin que AgencyHub se entere:

```markdown
---
cliente: CHC
fecha: 2026-08-17
tipo: diario          # diario | semanal
version: 1
competidores: [Acme, Globex]   # opcional
---

## Lo que cambió hoy

Cuerpo 100% libre.
```

AgencyHub solo parsea los cuatro campos de arriba. Todo lo demás se renderiza como markdown.

Para el informe semanal, `fecha` es el **lunes de la semana** y `tipo: semanal`. El agente lo produce; AgencyHub no lo calcula.

---

## 4. Modelo de datos: qué se agrega

Nada se rompe. Tres cambios:

**`accounts` — campos de ficha de cliente.** Hoy tiene solo `name`, `color`, `currency`. Campos a agregar: ⚠️ **por definir** (propuesta base: razón social, industria, sitio web, contacto principal con nombre/email/teléfono, fecha de inicio de relación, notas).

**`competitors` — tabla nueva.**
```
id            UUID PK
account_id    FK → accounts
name          string
website       string?
notes         text?
is_active     boolean DEFAULT true
created_at    timestamp
```

**`reports` — tabla nueva (índice de informes).**
```
id            UUID PK
account_id    FK → accounts
fecha         date
tipo          enum: diario, semanal
r2_key        string
version       int
created_at    timestamp
UNIQUE (account_id, fecha, tipo)
```

El `UNIQUE` hace la ingesta idempotente: si el agente reprocesa un día, sobreescribe en vez de duplicar.

**Feature flags:** por variable de entorno, no tabla. No amerita persistencia.

---

## 5. Permisos

Solo el equipo de Cluster. Los roles `admin` / `editor` que ya existen alcanzan, y **no hay que aislar datos por cuenta** — eso ahorra revisar cada query y es la razón principal por la que este MVP es alcanzable en poco tiempo.

Si más adelante el cliente necesita ver su informe, la salida barata es un link firmado con expiración, no un tercer rol.

---

## 6. Bloqueado a la espera de definición

| # | Qué falta | Bloquea |
|---|---|---|
| 1 | El punto **(b)** de la lista de análisis de competencia (el mensaje se cortó) | Diseño de la sección |
| 2 | **Un informe real de ejemplo** del agente | El visor. Es lo más bloqueante de todo |
| 3 | Dónde vive el agente hoy (n8n, Worker, script) | Cómo se autentica y desde dónde hace el POST |
| 4 | Campos exactos de la ficha de cliente | Migración de `accounts` |
| 5 | Fecha objetivo y cantidad de clientes al arranque | Orden de ejecución |

---

## 7. Orden de ejecución propuesto

**Paso 0 — terreno firme (antes de tocar nada).** Commitear las ~7.000 líneas que hoy están sin versionar, y reactivar el proyecto Supabase, que está caído por inactividad desde el 3 de mayo.

**Paso 1 — validar el riesgo. ✅ HECHO (18-ago-2026).** Resultado: `proxy.ts` no corre sobre Workers y no tiene arreglo en Next 16; además Prisma tampoco arranca ahí. Se decidió seguir en Vercel. Ver sección 2.1.

**Paso 2 — feature flags.** Ocultar gasto, presupuestos, conexiones y alarmas del sidebar. Rápido y deja el MVP presentable.

**Paso 3 — ficha de cliente + competidores.** Migración, UI y el endpoint `GET /api/clientes/activos` que consume el agente.

**Paso 4 — ingesta.** R2, tabla de índice y `POST /api/informes/ingest`. Con un informe de ejemplo se puede probar end-to-end sin que el agente esté listo.

**Paso 5 — visor de informes.** Navegación por fechas, switch diario/semanal, render de markdown.

Los pasos 0, 1 y 2 no dependen de ninguna de las definiciones pendientes de la sección 6.
