/**
 * Convert a slug or arbitrary string to ASCII safe filename component.
 * Strips Romanian diacritics, replaces non-alphanumerics with `-`, collapses
 * runs of `-`, trims edges, lowercases.
 */
export function sanitizeForFilename(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "guest";
}
