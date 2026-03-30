import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import crypto from "crypto";
import { turso } from "../lib/turso";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// List all API keys for logged-in user
router.get("/keys", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Check plan
  const userRow = await turso.execute({
    sql: `SELECT plan FROM users WHERE id = ?`,
    args: [userId],
  });
  const plan = String(userRow.rows[0]?.[0] ?? "free");

  if (plan !== "business") {
    res.status(403).json({ error: "API access is available on the Business plan only." });
    return;
  }

  const result = await turso.execute({
    sql: `SELECT id, name, key, revoked, created_at, last_used FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });

  const keys = result.rows.map((row) => ({
    id: String(row[0]),
    name: String(row[1]),
    key: String(row[2]),
    revoked: Boolean(row[3]),
    createdAt: String(row[4]),
    lastUsed: row[5] ? String(row[5]) : null,
  }));

  res.json(keys);
});

// Create a new API key
router.post("/keys", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userRow = await turso.execute({
    sql: `SELECT plan FROM users WHERE id = ?`,
    args: [userId],
  });
  const plan = String(userRow.rows[0]?.[0] ?? "free");

  if (plan !== "business") {
    res.status(403).json({ error: "API access is available on the Business plan only. Please upgrade." });
    return;
  }

  const name = (req.body?.name as string)?.trim() || "My API Key";

  // Limit to 5 keys per user
  const countRow = await turso.execute({
    sql: `SELECT COUNT(*) FROM api_keys WHERE user_id = ? AND revoked = 0`,
    args: [userId],
  });
  if (Number(countRow.rows[0][0]) >= 5) {
    res.status(400).json({ error: "Maximum of 5 active API keys allowed. Revoke one first." });
    return;
  }

  const id = crypto.randomUUID();
  const key = `1ur_${crypto.randomBytes(24).toString("hex")}`;

  await turso.execute({
    sql: `INSERT INTO api_keys (id, user_id, name, key) VALUES (?, ?, ?, ?)`,
    args: [id, userId, name, key],
  });

  logger.info({ userId, name }, "API key created");

  res.status(201).json({ id, name, key, revoked: false, createdAt: new Date().toISOString(), lastUsed: null });
});

// Revoke an API key
router.delete("/keys/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await turso.execute({
    sql: `SELECT id FROM api_keys WHERE id = ? AND user_id = ?`,
    args: [rawId, userId],
  });

  if (existing.rows.length === 0) {
    res.status(404).json({ error: "API key not found." });
    return;
  }

  await turso.execute({
    sql: `UPDATE api_keys SET revoked = 1 WHERE id = ? AND user_id = ?`,
    args: [rawId, userId],
  });

  logger.info({ userId, keyId: rawId }, "API key revoked");
  res.sendStatus(204);
});

export default router;
