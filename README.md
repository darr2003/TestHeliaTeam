# CM-Operaciones

Herramienta interna de Cluster Media. No la ve el cliente.

El producto se llama **AgencyHub** y tiene dos módulos:

| Módulo | Qué hace | Estado |
|---|---|---|
| **Análisis de competencia** | Recibe informes de un agente externo, los indexa y los muestra por cliente y por fecha | **Foco actual del MVP1** |
| **Control de gasto** | Gasto real de Meta y Google Ads contra el presupuesto planificado, con alarmas | Construido y probado, **apagado** tras un feature flag hasta validar las conexiones |

## Estructura del repositorio

```
.
├── agencyhub/                      la aplicación Next.js  ← acá se trabaja
│   ├── docs/cloudflare-workers.md  por qué NO estamos en Cloudflare
│   └── .env.local.example          plantilla de variables
├── AgencyHub_MVP_Spec_Control_de_Gasto.md   spec del módulo de gasto
├── PLAN_DESARROLLO.md                       plan del módulo de gasto
├── PLAN_MVP_COMPETENCIA.md                  plan vigente del MVP1
└── design_handoff_agencyhub/                referencia visual (Claude Design)
```

**La raíz del repo no es la app.** La app vive en `agencyhub/`. Esto importa en dos lugares: al correr comandos de npm y al configurar el deploy (ver más abajo).

## Puesta en marcha

```bash
cd agencyhub
npm install
cp .env.local.example .env.local     # completar con valores reales
npm run dev                          # http://localhost:3000
```

Las credenciales reales no están en el repo. Pedírselas a Felipe, o sacarlas del panel de Supabase y de Vercel.

**`DIRECT_URL` no es opcional.** `DATABASE_URL` va por el pooler; `DIRECT_URL` es la conexión directa que Prisma necesita para migraciones. Los scripts de seed deben apuntar a `DIRECT_URL` explícitamente o fallan contra pgbouncer.

## El agente de competencia

Esto es lo menos evidente del proyecto y conviene leerlo antes de tocar el módulo.

**El agente vive fuera de este repo.** Es un módulo independiente que tiene sus propios competidores, prompt, modelo e instrucciones. AgencyHub **solo consume** el informe terminado.

```
AGENTE (otro repo)
  │  POST /api/informes/ingest
  │  Authorization: Bearer INGEST_API_KEY
  │  markdown crudo, o JSON {"markdown": "..."}
  ▼
AGENCYHUB
  ├── valida frontmatter (cliente, fecha, tipo, version)
  ├── guarda el markdown
  └── UPSERT en el índice — reprocesar un día sobreescribe, no duplica
```

Tres cosas que hay que tener claras:

1. **El listado de competidores que alimenta el informe es del agente, no nuestro.** Los competidores que se cargan en la ficha de cliente son **informativos**. Se espera divergencia: de 10 en la ficha, el informe puede cubrir 5. Eso no es un error de sincronización y no hay que "arreglarlo".
2. **El único acople duro son los nombres de cliente.** El campo `cliente` del frontmatter debe coincidir con el nombre de la cuenta en AgencyHub o la ingesta responde 404. Los nombres se mantienen a mano en ambos lados por ahora.
3. **El informe semanal debe fecharse en lunes.** Si no, la validación lo rechaza con 422, porque la navegación por semanas quedaría con huecos.

`GET /api/clientes/activos` (mismo Bearer) devuelve los clientes y sus competidores. Al agente le sirve para alinear los nombres; el campo `competidores` puede ignorarlo.

## Deploy

Va en **Vercel**. Al importar el proyecto:

- **Root Directory: `agencyhub`** — sin esto el build falla, porque la raíz del repo no tiene `package.json`.
- Framework Next.js, build y output por defecto.
- Variables de entorno: las mismas del `.env.local.example`, menos las de Meta y Google, que no hacen falta mientras el módulo de gasto esté apagado.

Para generar el bloque pegable en el importador de Vercel desde un `.env.local` ya completo:

```bash
cd agencyhub
for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY \
         DATABASE_URL DIRECT_URL ENCRYPTION_KEY INGEST_API_KEY FEATURE_SPEND; do
  grep -m1 "^$k=" .env.local
done
```

**El cron está sacado a propósito.** `vercel.json` declaraba una corrida de `/api/sync` cada 4 horas para sincronizar el gasto. Hoy no hace nada, porque `/api/sync` corta de inmediato con el feature flag apagado, y el plan Hobby de Vercel solo admite crons diarios. Se recrea cuando se prenda el módulo de gasto; el commit `a5f8e79` tiene la receta exacta.

## Decisiones ya tomadas

No hace falta volver a discutirlas. Si se reabren, que sea con evidencia nueva.

- **Cloudflare Workers quedó descartado.** Se probó empíricamente: `proxy.ts` no puede ejecutarse ahí y Next 16 no ofrece alternativa, y además Prisma no arranca en workerd. El detalle, con los comandos para reproducirlo, está en [`agencyhub/docs/cloudflare-workers.md`](agencyhub/docs/cloudflare-workers.md). **El MVP sigue en Vercel.**
- **El almacenamiento externo de informes (R2) está pendiente a propósito.** Sin las variables `R2_*`, el markdown queda guardado en la base y eso funciona. Se resuelve por fila, así que prenderlo después no obliga a migrar nada.
- **La gestión de clientes podría centralizarse acá más adelante.** Por ahora es independiente del agente, y así arranca el MVP1.

## Trampas conocidas

**Turbopack y la raíz del workspace.** `next.config.ts` fija `turbopack.root` a mano. No sacarlo. Turbopack infiere la raíz buscando un lockfile hacia arriba, y si encuentra uno suelto en el directorio del usuario se pone a resolver y vigilar la carpeta personal entera. Eso llegó a consumir toda la memoria de un equipo, llenar el disco y hacer caer la sesión gráfica. Si el servidor de desarrollo tarda minutos en compilar o dispara decenas de procesos node, mirar esto antes que la versión de Next.

**Supabase se pausa por inactividad.** Ya pasó dos veces. Cuando ocurre, el host del proyecto deja de resolver por DNS y la aplicación queda sin base. Se reactiva desde el panel sin pérdida de datos. Con tráfico real deja de ser un problema.

**Esta no es la versión de Next.js que conocés.** Next 16 renombró `middleware.ts` a `proxy.ts`, los `params` de las páginas son promesas, y hay más cambios de convención. Ver `agencyhub/AGENTS.md`: la doc de la versión instalada está en `node_modules/next/dist/docs/`.

**La rama `exploracion/cloudflare-workers` tiene la estructura vieja**, con los archivos de la app en la raíz y sin el prefijo `agencyhub/`. Es anterior a la reestructuración y no se va a mergear: quedó como registro de una decisión ya cerrada.

## Estado actual

- Seis clientes activos: ATRIO, CHC, KIBO, LINK USS, NORVIAL, VITEPAL.
- El recorrido completo funciona: entrar, abrir competencia, elegir cliente, leer el informe.
- **Hay un informe de prueba en la base** (CHC, 2026-08-18, diario). Dice explícitamente que es una prueba. Borrarlo antes de mostrarle la plataforma a alguien:
  ```sql
  DELETE FROM reports WHERE date = '2026-08-18' AND type = 'diario';
  ```
- Ningún cliente tiene competidores cargados en la ficha. **No bloquea nada** — ver la sección del agente.
- No hay pantalla para cargar informes a mano; hoy la única vía es la API.
