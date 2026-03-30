import { Request, Response, NextFunction } from "express";
import { turso } from "./turso";

export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"];
  const apiKeyHeader = req.headers["x-api-key"] as string | undefined;

  let key: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    key = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    key = apiKeyHeader.trim();
  }

  if (!key || !key.startsWith("1ur_")) {
    res.status(401).json({ error: "Invalid or missing API key. Use Bearer <key> or X-Api-Key header." });
    return;
  }

  const result = await turso.execute({
    sql: `SELECT ak.user_id, u.plan, u.url_limit FROM api_keys ak
          JOIN users u ON u.id = ak.user_id
          WHERE ak.key = ? AND ak.revoked = 0`,
    args: [key],
  });

  if (result.rows.length === 0) {
    res.status(401).json({ error: "API key not found or revoked." });
    return;
  }

  const userId = String(result.rows[0][0]);
  const plan = String(result.rows[0][1]);
  const urlLimit = Number(result.rows[0][2]);

  // Update last_used timestamp
  turso.execute({
    sql: `UPDATE api_keys SET last_used = datetime('now') WHERE key = ?`,
    args: [key],
  }).catch(() => {});

  // Attach to request for downstream handlers
  (req as any).apiKeyUserId = userId;
  (req as any).apiKeyPlan = plan;
  (req as any).apiKeyUrlLimit = urlLimit;

  next();
}
