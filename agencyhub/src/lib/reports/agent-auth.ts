import "server-only";
import { timingSafeEqual } from "crypto";

/**
 * Autenticacion de los endpoints que consume el agente de competencia.
 * Un unico secreto compartido: el agente no necesita credenciales de R2 ni
 * acceso a la base.
 */
export function agentKeyIsValid(authorization: string | null): boolean {
  const expected = process.env.INGEST_API_KEY;
  if (!expected) return false;

  const prefix = "Bearer ";
  if (!authorization || !authorization.startsWith(prefix)) return false;

  const provided = authorization.slice(prefix.length);

  // Comparacion de tiempo constante. Los buffers deben medir igual, asi que la
  // diferencia de largo se chequea aparte.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
