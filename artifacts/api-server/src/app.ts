import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { initDb } from "./lib/turso";
import { handleRedirect } from "./lib/redirect";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors());

// Capture raw body for Razorpay webhook HMAC verification BEFORE json() middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/api/payments/webhook") {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

initDb().catch((err) => logger.error({ err }, "Failed to initialize database"));

// API routes
app.use("/api", router);

/**
 * Root-level slug redirect — MUST be registered AFTER /api routes.
 * Result: domain.com/abc123  →  302  →  original URL
 */
app.get("/:slug", handleRedirect);

export default app;
