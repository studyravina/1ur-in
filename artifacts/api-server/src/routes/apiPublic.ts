/**
 * Public API routes — authenticated via API Key (Bearer token or X-Api-Key header).
 * Available to Business plan users.
 * Base path: /api/v1/
 */
import { Router, type IRouter } from "express";
import crypto from "crypto";
import { turso } from "../lib/turso";
import { cache } from "../lib/cache";
import { apiKeyAuth } from "../lib/apiKeyAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// GET /api/v1/urls — list all URLs
router.get("/v1/urls", apiKeyAuth, async (req, res): Promise<void> => {
  const userId = (req as any).apiKeyUserId;

  const result = await turso.execute({
    sql: `SELECT id, slug, original_url, clicks, expires_at, created_at FROM short_urls WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });

  const urls = result.rows.map((row) => ({
    id: String(row[0]),
    slug: String(row[1]),
    shortUrl: `${process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`}/${row[1]}`,
    originalUrl: String(row[2]),
    clicks: Number(row[3]),
    expiresAt: row[4] ? String(row[4]) : null,
    createdAt: String(row[5]),
  }));

  res.json({ data: urls, count: urls.length });
});

// POST /api/v1/urls — create a short URL
router.post("/v1/urls", apiKeyAuth, async (req, res): Promise<void> => {
  const userId = (req as any).apiKeyUserId;
  const plan = (req as any).apiKeyPlan;
  const urlLimit = (req as any).apiKeyUrlLimit;

  const { url, slug: customSlug, expiresAt } = req.body ?? {};

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required in request body." });
    return;
  }

  try { new URL(url); } catch {
    res.status(400).json({ error: "Invalid URL format." });
    return;
  }

  // Custom slug: paid only
  if (customSlug && plan === "free") {
    res.status(403).json({ error: "Custom slugs require a paid plan." });
    return;
  }

  const countResult = await turso.execute({
    sql: `SELECT COUNT(*) FROM short_urls WHERE user_id = ?`,
    args: [userId],
  });
  if (Number(countResult.rows[0][0]) >= urlLimit) {
    res.status(403).json({ error: `URL limit reached (${urlLimit}). Upgrade your plan.` });
    return;
  }

  let slug = customSlug ?? generateSlug();

  if (customSlug) {
    const exists = await turso.execute({ sql: `SELECT id FROM short_urls WHERE slug = ?`, args: [slug] });
    if (exists.rows.length > 0) {
      res.status(409).json({ error: "Slug already taken." });
      return;
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const exists = await turso.execute({ sql: `SELECT id FROM short_urls WHERE slug = ?`, args: [slug] });
      if (exists.rows.length === 0) break;
      slug = generateSlug();
    }
  }

  const id = crypto.randomUUID();
  const parsedExpiry = expiresAt ? new Date(expiresAt).toISOString() : null;

  await turso.execute({
    sql: `INSERT INTO short_urls (id, slug, original_url, user_id, expires_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, slug, url, userId, parsedExpiry],
  });

  logger.info({ slug, userId, via: "api-key" }, "URL created via API");

  res.status(201).json({
    id,
    slug,
    shortUrl: `${process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`}/${slug}`,
    originalUrl: url,
    clicks: 0,
    expiresAt: parsedExpiry,
    createdAt: new Date().toISOString(),
  });
});

// DELETE /api/v1/urls/:slug — delete a short URL
router.delete("/v1/urls/:slug", apiKeyAuth, async (req, res): Promise<void> => {
  const userId = (req as any).apiKeyUserId;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  const existing = await turso.execute({
    sql: `SELECT id FROM short_urls WHERE slug = ? AND user_id = ?`,
    args: [slug, userId],
  });

  if (existing.rows.length === 0) {
    res.status(404).json({ error: "URL not found." });
    return;
  }

  await turso.execute({
    sql: `DELETE FROM short_urls WHERE slug = ? AND user_id = ?`,
    args: [slug, userId],
  });

  await cache.del(`slug:${slug}`);

  res.status(200).json({ message: "URL deleted successfully." });
});

// GET /api/v1/me — get current user info
router.get("/v1/me", apiKeyAuth, async (req, res): Promise<void> => {
  const userId = (req as any).apiKeyUserId;

  const userRow = await turso.execute({
    sql: `SELECT email, plan, url_limit FROM users WHERE id = ?`,
    args: [userId],
  });

  if (userRow.rows.length === 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const countRow = await turso.execute({
    sql: `SELECT COUNT(*) FROM short_urls WHERE user_id = ?`,
    args: [userId],
  });

  const urlLimit = Number(userRow.rows[0][2]);
  const urlsUsed = Number(countRow.rows[0][0]);

  res.json({
    userId,
    email: String(userRow.rows[0][0]),
    plan: String(userRow.rows[0][1]),
    urlLimit,
    urlsUsed,
    urlsRemaining: Math.max(0, urlLimit - urlsUsed),
  });
});

export default router;
