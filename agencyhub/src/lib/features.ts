import "server-only";

import { notFound } from "next/navigation";

/**
 * Feature flags del MVP.
 *
 * `spend` cubre todo el modulo de control de gasto — dashboard, presupuestos,
 * conexiones, alarmas, reportes y tipo de cambio. El codigo esta completo pero
 * queda apagado hasta que las conexiones a Meta y Google esten validadas.
 *
 * Se leen desde el entorno, no desde la base: no amerita persistencia y asi el
 * flag se puede cambiar por deploy sin migracion.
 *
 * Este modulo es server-only a proposito. Las variables no llevan prefijo
 * NEXT_PUBLIC, asi que en el browser serian `undefined` y el flag caeria
 * silenciosamente a su default. Para los client components, los flags viajan
 * como props desde el layout.
 */

function flag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

export interface Features {
  spend: boolean;
}

export function getFeatures(): Features {
  return {
    spend: flag("FEATURE_SPEND", false),
  };
}

export function isEnabled(name: keyof Features): boolean {
  return getFeatures()[name];
}

/**
 * Corta el render de una pagina cuyo modulo esta apagado.
 *
 * Devuelve 404 en vez de redirigir: si el modulo no esta habilitado, la ruta
 * no existe para este deploy, y un 404 no filtra que exista algo detras.
 */
export function requireFeature(name: keyof Features): void {
  if (!getFeatures()[name]) notFound();
}

/** Ruta de aterrizaje segun los modulos habilitados. */
export function defaultRoute(): string {
  return getFeatures().spend ? "/dashboard" : "/competencia";
}
