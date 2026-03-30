/**
 * Shared slug-redirect handler.
 * Used at the root level: GET /:slug  →  302 to original URL
 */
import { type Request, type Response } from "express";
import { turso } from "./turso";
import { cache } from "./cache";

const VALID_SLUG = /^[a-zA-Z0-9_-]{3,32}$/;

export async function handleRedirect(req: Request, res: Response): Promise<void> {
  const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  // Ignore anything that doesn't look like a slug (favicon.ico, robots.txt, etc.)
  if (!VALID_SLUG.test(rawSlug)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const cacheKey = `slug:${rawSlug}`;
  const clickKey = `clicks:${rawSlug}`;

  // Try Redis cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    if (cache.isAvailable()) {
      cache.incr(clickKey).catch(() => {});
    } else {
      turso.execute({
        sql: `UPDATE short_urls SET clicks = clicks + 1 WHERE slug = ?`,
        args: [rawSlug],
      }).catch(() => {});
    }
    res.redirect(302, cached);
    return;
  }

  // Cache miss — load from DB
  const result = await turso.execute({
    sql: `SELECT original_url FROM short_urls WHERE slug = ?`,
    args: [rawSlug],
  });

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }

  const originalUrl = String(result.rows[0][0]);

  // Warm the cache (1 year TTL)
  await cache.set(cacheKey, originalUrl, 365 * 24 * 3600);

  if (cache.isAvailable()) {
    cache.incr(clickKey).catch(() => {});
  } else {
    turso.execute({
      sql: `UPDATE short_urls SET clicks = clicks + 1 WHERE slug = ?`,
      args: [rawSlug],
    }).catch(() => {});
  }

  res.redirect(302, originalUrl);
}
