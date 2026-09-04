/**
 * Helpers puros de nomenclatura de informes. Sin dependencias de runtime a
 * proposito: se usan tanto en el servidor como en tests, y no arrastran el
 * cliente de R2.
 */

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** informes/{cliente}/{fecha}-{tipo}.md */
export function reportKey(
  accountName: string,
  date: string,
  type: "diario" | "semanal"
): string {
  return `informes/${slugify(accountName)}/${date}-${type}.md`;
}
