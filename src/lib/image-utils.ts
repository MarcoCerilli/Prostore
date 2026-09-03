// Utility per la normalizzazione e gestione sicura delle immagini
// Risolve percorsi relativi errati, stringhe JSON, URL esterni e fornisce fallback SVG a costo zero senza dipendenze da server esterni (evita rate limit e blocchi Vercel).

export const DEFAULT_PRODUCT_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" fill="none">
  <rect width="800" height="800" fill="#F8FAFC"/>
  <rect x="20" y="20" width="760" height="760" rx="24" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="10 10"/>
  <g transform="translate(340, 310)">
    <rect width="120" height="96" rx="16" fill="#94A3B8"/>
    <circle cx="36" cy="36" r="14" fill="#F1F5F9"/>
    <path d="M12 80 L48 44 L78 68 L96 52 L114 80 Z" fill="#64748B"/>
  </g>
  <text x="400" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#334155" text-anchor="middle">Immagine Prodotto</text>
  <text x="400" y="495" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748B" text-anchor="middle">Anteprima non disponibile</text>
</svg>
`);

/**
 * Normalizza una singola immagine in un URL valido e funzionante.
 * Gestisce:
 * - URL remoti completi (http/https)
 * - Data URI
 * - Percorsi relativi che mancano di slash iniziale (es. "images/..." -> "/images/...")
 * - Nomi di file semplici (es. "p1-1.jpg" -> "/images/sample-products/p1-1.jpg")
 */
export function normalizeProductImage(rawImage?: unknown): string {
  if (!rawImage || typeof rawImage !== "string") {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }

  const trimmed = rawImage.trim();
  if (!trimmed) {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }

  // Se è già un URL completo o un Data URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Se è un percorso assoluto locale
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Se è un percorso relativo locale senza slash iniziale
  if (trimmed.startsWith("images/")) {
    return `/${trimmed}`;
  }

  // Se è un nome file dei sample-products es. "p1-1.jpg"
  if (/^p\d+-\d+\.(jpg|jpeg|png|webp|svg)$/i.test(trimmed)) {
    return `/images/sample-products/${trimmed}`;
  }

  // Fallback sicuro con slash iniziale
  return `/${trimmed}`;
}

/**
 * Normalizza qualsiasi input immagini (array, stringa JSON, stringa con virgole, singolo elemento)
 * in un array di URL di immagini validi e sicuri.
 */
export function normalizeProductImages(images: unknown): string[] {
  if (!images) return [];

  let candidates: unknown[] = [];

  if (Array.isArray(images)) {
    candidates = images;
  } else if (typeof images === "string") {
    const trimmed = images.trim();
    if (!trimmed) return [];

    // Se è una stringa JSON serializzata
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          candidates = parsed;
        } else {
          candidates = [trimmed];
        }
      } catch {
        candidates = [trimmed];
      }
    } else if (trimmed.includes(",")) {
      candidates = trimmed.split(",").map((s) => s.trim());
    } else {
      candidates = [trimmed];
    }
  } else {
    return [];
  }

  const result: string[] = [];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim().length > 0) {
      result.push(normalizeProductImage(item));
    }
  }

  return result;
}
