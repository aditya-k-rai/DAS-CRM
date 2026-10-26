/**
 * Shared product image resolver and resilient error fallback utility.
 * Ensures images render reliably across Catalog, Lead Workspaces, and Quotations.
 */

export const DEFAULT_PRODUCT_FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiLz48L3N2Zz4=';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  jacket: '/products/puff-jackets.jpg',
  puff: '/products/puff-jackets.jpg',
  coat: '/products/puff-jackets.jpg',
  leather: '/products/puff-jackets.jpg',
};

/**
 * Returns true if the image URL is missing, blank, or matches a default placeholder SVG.
 */
export function isPlaceholderOrFallback(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed === DEFAULT_PRODUCT_FALLBACK_IMAGE) return true;
  if (trimmed.startsWith('data:image/svg+xml')) return true;
  return false;
}

/**
 * Normalizes a relative or absolute product image URL.
 */
export function normalizeProductImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (!trimmed.startsWith('/')) {
    trimmed = '/' + trimmed;
  }
  return trimmed;
}

/**
 * Resolves the optimal product image cover URL with multi-tiered resolution:
 * 1. Provided image URL (if not placeholder)
 * 2. Client-stored custom image (if not placeholder)
 * 3. Smart category/keyword fallback (e.g. jacket -> /products/puff-jackets.jpg)
 * 4. Default SVG placeholder
 */
export function getProductCoverImage(
  imgSrc?: string | null,
  id?: string | null,
  sku?: string | null,
  category?: string | null,
  name?: string | null
): string {
  // 1. If explicit imgSrc is provided and not a placeholder, normalize and use it
  if (imgSrc && !isPlaceholderOrFallback(imgSrc)) {
    return normalizeProductImageUrl(imgSrc);
  }

  // 2. Check client custom images in localStorage
  if (typeof window !== 'undefined' && (id || sku)) {
    try {
      const s = localStorage.getItem('das_crm_custom_product_images');
      if (s) {
        const customMap = JSON.parse(s);
        const match = (id ? customMap[id] : null) || (sku ? customMap[sku] : null);
        if (match && match.coverImage && !isPlaceholderOrFallback(match.coverImage)) {
          return normalizeProductImageUrl(match.coverImage);
        }
      }
    } catch (_) {}
  }

  // 3. Smart category fallback
  const catKeywords = `${category || ''} ${name || ''}`.toLowerCase();
  for (const [key, fallbackUrl] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (catKeywords.includes(key)) {
      return fallbackUrl;
    }
  }

  return DEFAULT_PRODUCT_FALLBACK_IMAGE;
}

/**
 * Resilient, multi-stage error handler for product image <img> elements.
 * Prevents broken image icons and avoids infinite error loops.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  product?: {
    category?: string | null;
    name?: string | null;
    images?: string[] | null;
  }
) {
  const target = e.currentTarget;
  const currentStage = parseInt(target.dataset.errorStage || '0', 10);

  // Stage 0 -> 1: Try secondary gallery image
  if (currentStage === 0 && product?.images && product.images.length > 1) {
    const alternate = product.images.find(
      (img) => img && !isPlaceholderOrFallback(img) && normalizeProductImageUrl(img) !== target.src
    );
    if (alternate) {
      target.dataset.errorStage = '1';
      target.src = normalizeProductImageUrl(alternate);
      return;
    }
  }

  // Stage 1 -> 2: Try category fallback (e.g. puff-jackets.jpg)
  if (currentStage < 2) {
    const catKeywords = `${product?.category || ''} ${product?.name || ''}`.toLowerCase();
    for (const [key, fallbackUrl] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
      if (catKeywords.includes(key) && !target.src.includes(fallbackUrl)) {
        target.dataset.errorStage = '2';
        target.src = fallbackUrl;
        return;
      }
    }
  }

  // Stage 2 -> 3: Final fallback to default placeholder SVG
  target.dataset.errorStage = '3';
  target.onerror = null;
  target.src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
}
