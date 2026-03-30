import { createClient } from "@libsql/client";

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL must be set");
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN must be set");
}

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await turso.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      url_limit INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS short_urls (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      original_url TEXT NOT NULL,
      user_id TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      payment_id TEXT,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'My API Key',
      key TEXT NOT NULL UNIQUE,
      revoked INTEGER NOT NULL DEFAULT 0,
      last_used TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    // Add expires_at column if it doesn't exist (migration for existing DBs)
    `CREATE INDEX IF NOT EXISTS idx_short_urls_slug ON short_urls(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key)`,
  ], "write");
}
