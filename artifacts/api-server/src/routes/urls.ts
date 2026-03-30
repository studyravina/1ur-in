import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { turso } from "../lib/turso";
import { cache } from "../lib/cache";
import { CreateUrlBody, ListUrlsResponseItem } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function ensureUser(userId: string, email: string) {
  await turso.execute({
    sql: `INSERT OR IGNORE INTO users (id, email, plan, url_limit) VALUES (?, ?, 'free', 5)`,
    args: [userId, email],
  });
}

router.get("/urls", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const result = await turso.execute({
    sql: `SELECT id, slug, original_url, clicks, created_at, user_id FROM short_urls WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });

  const urls = result.rows.map((row) =>
    ListUrlsResponseItem.parse({
      id: row[0],
      slug: row[1],
      originalUrl: row[2],
      clicks: row[3],
      createdAt: row[4],
      userId: row[5],
    })
  );

  res.json(urls);
});

router.post("/urls", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateUrlBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Load user profile
  const userResult = await turso.execute({
    sql: `SELECT email, plan, url_limit FROM users WHERE id = ?`,
    args: [userId],
  });

  let email = "unknown@example.com";
  let urlLimit = 5;
  let plan = "free";

  if (userResult.rows.length === 0) {
    await ensureUser(userId, email);
  } else {
    email = String(userResult.rows[0][0]);
    plan = String(userResult.rows[0][1]);
    urlLimit = Number(userResult.rows[0][2]);
  }

  // Block custom slugs for free users
  if (parsed.data.customSlug && plan === "free") {
    res.status(403).json({
      error: "Custom slugs are a paid feature. Please upgrade your plan to use custom URLs.",
    });
    return;
  }

  const countResult = await turso.execute({
    sql: `SELECT COUNT(*) FROM short_urls WHERE user_id = ?`,
    args: [userId],
  });
  const urlsUsed = Number(countResult.rows[0][0]);

  if (urlsUsed >= urlLimit) {
    res.status(403).json({ error: `URL limit reached (${urlLimit}). Please upgrade your plan.` });
    return;
  }

  let slug = parsed.data.customSlug ?? generateSlug();

  if (parsed.data.customSlug) {
    const existingSlug = await turso.execute({
      sql: `SELECT id FROM short_urls WHERE slug = ?`,
      args: [slug],
    });
    if (existingSlug.rows.length > 0) {
      res.status(400).json({ error: "Custom slug is already taken. Please choose another." });
      return;
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      const existing = await turso.execute({
        sql: `SELECT id FROM short_urls WHERE slug = ?`,
        args: [slug],
      });
      if (existing.rows.length === 0) break;
      slug = generateSlug();
      attempts++;
    }
  }

  const id = crypto.randomUUID();
  await turso.execute({
    sql: `INSERT INTO short_urls (id, slug, original_url, user_id) VALUES (?, ?, ?, ?)`,
    args: [id, slug, parsed.data.originalUrl, userId],
  });

  // Cache slug → URL immediately (1 year TTL)
  await cache.set(`slug:${slug}`, parsed.data.originalUrl, 365 * 24 * 3600);

  const newUrl = ListUrlsResponseItem.parse({
    id,
    slug,
    originalUrl: parsed.data.originalUrl,
    clicks: 0,
    createdAt: new Date().toISOString(),
    userId,
  });

  req.log.info({ slug, userId, plan }, "URL created");
  res.status(201).json(newUrl);
});

router.delete("/urls/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await turso.execute({
    sql: `SELECT id, slug FROM short_urls WHERE id = ? AND user_id = ?`,
    args: [rawId, userId],
  });

  if (existing.rows.length === 0) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  const deletedSlug = String(existing.rows[0][1]);

  await turso.execute({
    sql: `DELETE FROM short_urls WHERE id = ? AND user_id = ?`,
    args: [rawId, userId],
  });

  // Remove both the slug cache AND the buffered click counter from Redis
  await Promise.all([
    cache.del(`slug:${deletedSlug}`),
    cache.del(`clicks:${deletedSlug}`),
  ]);

  res.sendStatus(204);
});

export default router;
