# AgencyHub

Aplicación Next.js de la herramienta interna de Cluster Media.

**Leer primero el [README de la raíz](../README.md)**: ahí está el contexto del producto, el contrato con el agente de competencia, las decisiones ya tomadas y las trampas conocidas. Este archivo cubre solo lo operativo de la app.

## Comandos

```bash
npm install
cp .env.local.example .env.local     # completar con valores reales
npm run dev                          # http://localhost:3000
npm run build                        # build de producción (corre typecheck)
npm run lint
npm run seed                         # datos iniciales
```

Los comandos de Prisma corren desde esta carpeta:

```bash
npx prisma migrate status
npx prisma migrate deploy            # aplicar migraciones pendientes
npx prisma studio                    # explorar la base
```

## Cómo está organizado

```
src/
├── app/
│   ├── (app)/              rutas autenticadas (layout con requireAuth)
│   │   ├── competencia/    módulo de informes  ← foco del MVP1
│   │   ├── cuentas/        clientes y ficha
│   │   └── ...             gasto, presupuestos, alarmas (tras feature flag)
│   ├── api/
│   │   ├── informes/ingest      entrada de informes del agente
│   │   └── clientes/activos     lista que el agente puede consultar
│   └── login/
├── lib/
│   ├── reports/            frontmatter, almacenamiento, render markdown
│   ├── auth.ts             getSession, requireAuth, requireAdmin
│   └── features.ts         feature flags por variable de entorno
└── proxy.ts                refresh de sesión (era middleware.ts en Next 15)
```

## Dos cosas a tener en cuenta al tocar el código

**La protección de rutas está duplicada, y es a propósito.** `proxy.ts` redirige a `/login`, pero además `(app)/layout.tsx` llama a `requireAuth()` por su cuenta. Si `proxy.ts` deja de correr, las rutas siguen protegidas; lo que se pierde es el refresh de la cookie de sesión, que hoy ocurre únicamente ahí.

**El render de informes escapa HTML a propósito.** `lib/reports/markdown.ts` usa `html: false` porque el contenido lo produce un LLM a partir de sitios de terceros scrapeados. No habilitar HTML crudo sin pensar bien qué se está permitiendo.

## Feature flags

`FEATURE_SPEND` controla todo el módulo de gasto: dashboard, presupuestos, conexiones, alarmas, reportes y tipo de cambio. Con el flag apagado esas rutas devuelven 404, desaparecen del menú, y el login aterriza en `/competencia` en vez de `/dashboard`.

Se leen del entorno, no de la base, así que se cambian por deploy y sin migración.
