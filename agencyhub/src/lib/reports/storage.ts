import "server-only";
import { AwsClient } from "aws4fetch";

export { slugify, reportKey } from "@/lib/reports/keys";

/**
 * Almacenamiento de los .md de informes.
 *
 * R2 es el destino definitivo, y se accede por su API compatible con S3 para
 * que funcione igual desde Vercel hoy y desde Workers cuando migremos (alla se
 * podra cambiar por un binding nativo sin tocar a los llamadores).
 *
 * Si R2 no esta configurado, el informe se guarda inline en la columna
 * `content` de la tabla reports. Eso permite que el modulo funcione sin
 * depender de que exista el bucket, y prender R2 despues sin migrar datos:
 * los informes viejos siguen leyendose desde la DB.
 */

interface R2Config {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function readConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { accountId, bucket, accessKeyId, secretAccessKey };
}

export function isR2Configured(): boolean {
  return readConfig() !== null;
}

function clientFor(config: R2Config): AwsClient {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

function urlFor(config: R2Config, key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encoded}`;
}

export async function putMarkdown(key: string, markdown: string): Promise<void> {
  const config = readConfig();
  if (!config) throw new Error("R2 no esta configurado");

  const res = await clientFor(config).fetch(urlFor(config, key), {
    method: "PUT",
    body: markdown,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });

  if (!res.ok) {
    throw new Error(`R2 respondio ${res.status} al guardar ${key}`);
  }
}

export async function getMarkdown(key: string): Promise<string> {
  const config = readConfig();
  if (!config) throw new Error("R2 no esta configurado");

  const res = await clientFor(config).fetch(urlFor(config, key));
  if (!res.ok) {
    throw new Error(`R2 respondio ${res.status} al leer ${key}`);
  }
  return res.text();
}
