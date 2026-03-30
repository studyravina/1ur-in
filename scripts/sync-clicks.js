#!/usr/bin/env node
/**
 * sync-clicks.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Flushes buffered click counts from Redis into the Turso (libSQL) database.
 *
 * HOW IT WORKS:
 *   1. Scan Redis for all keys matching "clicks:*"
 *   2. For each key, atomically read & delete its value (the buffered count)
 *   3. Increment the matching row in short_urls by that amount
 *   4. Exit cleanly — PM2 will re-run it on schedule
 *
 * PM2 SETUP (run once on your VPS):
 *   npm install -g pm2
 *   pm2 start scripts/sync-clicks.js --name sync-clicks --cron "* * * * *" --no-autorestart
 *   pm2 save
 *   pm2 startup   # follow the printed command to auto-start on reboot
 *
 * Cron expression "* * * * *" = every 1 minute.
 * Change to "*/5 * * * *" for every 5 minutes, etc.
 *
 * ENVIRONMENT VARIABLES REQUIRED (.env or PM2 ecosystem.config.js):
 *   REDIS_URL          — e.g. redis://localhost:6379 or redis://user:pass@host:6379
 *   TURSO_DATABASE_URL — e.g. libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN   — Turso auth token
 *
 * REDIS CONNECTION:
 *   - Same VPS as backend: use redis://localhost:6379 (fastest, no network hop)
 *   - Remote Redis (Upstash, Redis Cloud, etc.): use the full TLS URL they provide,
 *     e.g. rediss://user:pass@host:6380  (note: "rediss" for TLS)
 *   Both work fine — just set REDIS_URL accordingly.
 */

"use strict";

require("dotenv").config(); // optional — load .env if present

const REDIS_URL = process.env.REDIS_URL;
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!REDIS_URL)  { console.error("[sync-clicks] REDIS_URL is not set. Exiting."); process.exit(0); }
if (!TURSO_URL)  { console.error("[sync-clicks] TURSO_DATABASE_URL is not set. Exiting."); process.exit(1); }
if (!TURSO_TOKEN){ console.error("[sync-clicks] TURSO_AUTH_TOKEN is not set. Exiting."); process.exit(1); }

async function run() {
  const start = Date.now();

  // ── Connect Redis ────────────────────────────────────────────────────────────
  const { default: Redis } = await import("ioredis");
  const redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: 2,
  });
  await redis.connect();

  // ── Connect Turso ────────────────────────────────────────────────────────────
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // ── Scan for click keys ──────────────────────────────────────────────────────
  const keys = await redis.keys("clicks:*");

  if (keys.length === 0) {
    console.log(`[sync-clicks] No pending clicks. (${Date.now() - start}ms)`);
    await redis.quit();
    return;
  }

  let synced = 0;
  let totalClicks = 0;

  for (const key of keys) {
    // GETDEL: atomically read and remove the key.
    // If Redis < 6.2, falls back to GET + DEL.
    let raw;
    if (typeof redis.getdel === "function") {
      raw = await redis.getdel(key);
    } else {
      raw = await redis.get(key);
      if (raw !== null) await redis.del(key);
    }

    if (!raw) continue;

    const count = parseInt(raw, 10);
    if (!count || count <= 0) continue;

    // Extract slug from key "clicks:{slug}"
    const slug = key.replace(/^clicks:/, "");

    try {
      await db.execute({
        sql: `UPDATE short_urls SET clicks = clicks + ? WHERE slug = ?`,
        args: [count, slug],
      });
      synced++;
      totalClicks += count;
    } catch (err) {
      // Put the count back so we don't lose data on DB error
      await redis.incrby(key, count);
      console.error(`[sync-clicks] DB error for slug "${slug}":`, err.message);
    }
  }

  console.log(`[sync-clicks] Synced ${totalClicks} clicks across ${synced} URLs. (${Date.now() - start}ms)`);

  await redis.quit();
}

run().catch((err) => {
  console.error("[sync-clicks] Fatal error:", err);
  process.exit(1);
});
