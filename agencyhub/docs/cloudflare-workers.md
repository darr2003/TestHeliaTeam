# Cloudflare Workers: exploracion, no adoptada

**Fecha:** 18 de agosto de 2026
**Estado:** exploracion. El MVP sigue desplegando en Vercel.
**Corresponde al:** paso 1 de `PLAN_MVP_COMPETENCIA.md`

Este documento existe para que nadie tenga que repetir la prueba. La config de
Cloudflare (`wrangler.jsonc`, `open-next.config.ts`) esta commiteada pero **no
esta en uso**: ninguna rama de deploy la consume.

## Veredicto

`proxy.ts` **no puede correr sobre OpenNext/Workers**, y no es un problema de
versiones que se arregle esperando.

| Prueba | Resultado |
|---|---|
| `opennextjs-cloudflare build` **con** `proxy.ts` | falla: `Node.js middleware is not currently supported` |
| `opennextjs-cloudflare build` **sin** `proxy.ts` | completa, genera `.open-next/worker.js` |
| `/login` sobre workerd (`wrangler dev`) | HTTP 200 |
| `/api/clientes/activos` sin token | HTTP 401 — la auth del agente funciona |
| `/api/clientes/activos` con token (pega a Prisma) | HTTP 500 — no encuentra el query engine |

Probado contra Next 16.2.12, @opennextjs/cloudflare 1.20.2, wrangler 4.124.0.

## Por que no se arregla solo

El issue que motivo esta prueba mencionaba wrangler 4.90.1 con OpenNext 1.19.9.
Se probo con las versiones actuales y falla igual. El piso de peer dependency de
OpenNext obligo a subir Next de 16.2.4 a 16.2.12 (1.19.9 ya pedia `>=16.2.6`;
1.20.2 pide `>=16.2.11`), asi que la prueba corrio en el terreno mas favorable
posible.

OpenNext sugiere "switch to Edge Middleware". **Eso es inaplicable en Next 16.**
De la doc oficial en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`:

> Proxy defaults to using the Node.js runtime. The `runtime` config option is not
> available in Proxy files. Setting the `runtime` config option in Proxy will
> throw an error.

No hay escotilla: en Next 16 el middleware es Node y punto. Para ir a Workers hay
que **borrar** `proxy.ts`, no reconfigurarlo.

## Que costaria irse a Workers

Dos reformas, ninguna trivial:

**1. Mover el refresh de sesion.** Sacar `proxy.ts` **no** desprotege las rutas:
`src/app/(app)/layout.tsx` llama a `requireAuth()`, que hace su propio
`getSession()` y redirige. Eso se verifico y se sostiene.

Lo que si se pierde es el refresh de la cookie. Hoy ocurre **unicamente** en
`proxy.ts`, porque el client de Server Component (`src/lib/supabase/server.ts`)
descarta los writes de cookie en un `catch {}` — es el patron estandar de
`@supabase/ssr`. Sin proxy, el usuario se desloguea cuando expira el access token
(~1h) en vez de renovarse solo. Hay que mover ese refresh a un route handler o a
un Server Action.

**2. Migrar Prisma a driver adapters.** El plan decia "Prisma funciona sobre
Hyperdrive", que es cierto pero incompleto: el engine actual no corre en workerd
(ver el 500 de arriba). Exige `@prisma/adapter-pg`, el `previewFeatures`
correspondiente en el `generator` del schema, y reescribir `src/lib/prisma.ts`.

## Requisito de entorno

`wrangler` exige **Node >= 22**. La maquina de desarrollo corre v20.16.0 por
defecto; hay una v24.4.1 via nvm:

```bash
PATH="$HOME/.nvm/versions/node/v24.4.1/bin:$PATH" npx wrangler dev --port 8788
```

El `build` de OpenNext si corre en Node 20; solo el CLI de wrangler exige 22+.

## Como reproducir

```bash
# 1. las vars de entorno para workerd (gitignoreado, tiene secretos)
grep -vE '^\s*#|^\s*$' .env.local > .dev.vars && chmod 600 .dev.vars

# 2. build (falla con proxy.ts presente — ese es el punto)
npx opennextjs-cloudflare build

# 3. runtime, con Node 22+
PATH="$HOME/.nvm/versions/node/v24.4.1/bin:$PATH" npx wrangler dev --port 8788
```

## Nota sobre R2

Que no vayamos a Workers **no bloquea R2**. `src/lib/reports/storage.ts` habla
con R2 por su API S3 usando `aws4fetch`, precisamente para funcionar igual desde
Vercel. R2 se puede prender cuando se quiera, sin tocar el deploy.
