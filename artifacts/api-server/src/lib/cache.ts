import { logger } from "./logger";

type CacheClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
  /** Atomic increment — used for buffering click counts */
  incr: (key: string) => Promise<number>;
  /** Scan keys matching a pattern */
  keys: (pattern: string) => Promise<string[]>;
  /** Get and delete atomically */
  getdel: (key: string) => Promise<string | null>;
  isAvailable: () => boolean;
};

let redisClient: any = null;
let redisAvailable = false;

async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info("REDIS_URL not set — running without Redis cache (optional)");
    return;
  }

  try {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });

    await redisClient.connect();
    redisAvailable = true;
    logger.info("Redis connected");

    redisClient.on("error", (err: Error) => {
      if (redisAvailable) {
        logger.warn({ err: err.message }, "Redis error — falling back to direct DB mode");
      }
      redisAvailable = false;
    });

    redisClient.on("connect", () => {
      redisAvailable = true;
      logger.info("Redis reconnected");
    });
  } catch (err) {
    logger.warn({ err }, "Redis unavailable — running without cache");
    redisAvailable = false;
  }
}

initRedis().catch(() => {});

export const cache: CacheClient = {
  isAvailable: () => redisAvailable,

  async get(key: string): Promise<string | null> {
    if (!redisAvailable || !redisClient) return null;
    try { return await redisClient.get(key); } catch { return null; }
  },

  async set(key: string, value: string, ttlSeconds = 60): Promise<void> {
    if (!redisAvailable || !redisClient) return;
    try { await redisClient.set(key, value, "EX", ttlSeconds); } catch {}
  },

  async del(key: string): Promise<void> {
    if (!redisAvailable || !redisClient) return;
    try { await redisClient.del(key); } catch {}
  },

  async incr(key: string): Promise<number> {
    if (!redisAvailable || !redisClient) return 0;
    try { return await redisClient.incr(key); } catch { return 0; }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redisAvailable || !redisClient) return [];
    try { return await redisClient.keys(pattern); } catch { return []; }
  },

  async getdel(key: string): Promise<string | null> {
    if (!redisAvailable || !redisClient) return null;
    try {
      // GETDEL available in Redis 6.2+; fallback to GET + DEL
      if (typeof redisClient.getdel === "function") {
        return await redisClient.getdel(key);
      }
      const val = await redisClient.get(key);
      if (val !== null) await redisClient.del(key);
      return val;
    } catch { return null; }
  },
};
