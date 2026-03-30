import { Router, type IRouter } from "express";
import { requireAuth, getAuth, clerkClient } from "@clerk/express";
import { turso } from "../lib/turso";
import { GetMeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/user/me", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "unknown@example.com";

  const userResult = await turso.execute({
    sql: `SELECT plan, url_limit FROM users WHERE id = ?`,
    args: [userId],
  });

  let plan = "free";
  let urlLimit = 5;

  if (userResult.rows.length === 0) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO users (id, email, plan, url_limit) VALUES (?, ?, 'free', 5)`,
      args: [userId, email],
    });
  } else {
    plan = String(userResult.rows[0][0]);
    urlLimit = Number(userResult.rows[0][1]);
  }

  const countResult = await turso.execute({
    sql: `SELECT COUNT(*) FROM short_urls WHERE user_id = ?`,
    args: [userId],
  });
  const urlsUsed = Number(countResult.rows[0][0]);
  const urlsRemaining = Math.max(0, urlLimit - urlsUsed);

  const profile = GetMeResponse.parse({
    userId,
    email,
    plan,
    urlLimit,
    urlsUsed,
    urlsRemaining,
  });

  res.json(profile);
});

export default router;
