import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { turso } from "../lib/turso";
import { CreatePaymentOrderBody, CreatePaymentOrderResponse, VerifyPaymentBody, GetMeResponse } from "@workspace/api-zod";
import { PLANS, isPlanId } from "../lib/plans";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

router.post("/payments/create-order", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreatePaymentOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { planId } = parsed.data;
  if (!isPlanId(planId)) {
    res.status(400).json({ error: "Invalid plan ID. Must be starter, pro, or business." });
    return;
  }

  const plan = PLANS[planId];
  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503).json({ error: "Payment gateway not configured. Please contact support." });
    return;
  }

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: "INR",
    receipt: `rcpt_${userId.slice(0, 10)}_${Date.now()}`,
    notes: { planId, userId },
  });

  await turso.execute({
    sql: `INSERT OR REPLACE INTO payments (id, user_id, order_id, plan_id, status, amount) VALUES (?, ?, ?, ?, 'pending', ?)`,
    args: [crypto.randomUUID(), userId, order.id, planId, plan.amount],
  });

  const response = CreatePaymentOrderResponse.parse({
    orderId: order.id,
    amount: plan.amount,
    currency: "INR",
    planId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });

  res.json(response);
});

router.post("/payments/verify", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = parsed.data;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) { res.status(503).json({ error: "Payment gateway not configured." }); return; }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    res.status(400).json({ error: "Invalid payment signature. Verification failed." });
    return;
  }

  if (!isPlanId(planId)) { res.status(400).json({ error: "Invalid plan ID" }); return; }

  const plan = PLANS[planId];

  await turso.execute({
    sql: `UPDATE payments SET status = 'paid', payment_id = ? WHERE order_id = ?`,
    args: [razorpayPaymentId, razorpayOrderId],
  });

  await turso.execute({
    sql: `UPDATE users SET plan = ?, url_limit = ? WHERE id = ?`,
    args: [planId, plan.urlLimit, userId],
  });

  const countResult = await turso.execute({
    sql: `SELECT COUNT(*) FROM short_urls WHERE user_id = ?`,
    args: [userId],
  });
  const urlsUsed = Number(countResult.rows[0][0]);
  const urlsRemaining = Math.max(0, plan.urlLimit - urlsUsed);

  const userResult = await turso.execute({
    sql: `SELECT email FROM users WHERE id = ?`,
    args: [userId],
  });
  const email = String(userResult.rows[0]?.[0] ?? "unknown@example.com");

  const profile = GetMeResponse.parse({
    userId,
    email,
    plan: planId,
    urlLimit: plan.urlLimit,
    urlsUsed,
    urlsRemaining,
  });

  res.json(profile);
});

// ─── Razorpay Webhook ───────────────────────────────────────────────
// Razorpay POSTs events here automatically (even if user closes browser).
// Configure this URL in Razorpay Dashboard → Webhooks.
// Set RAZORPAY_WEBHOOK_SECRET env var to the secret you create there.
router.post("/payments/webhook", async (req, res): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn("RAZORPAY_WEBHOOK_SECRET not set — webhook ignored");
    res.status(200).json({ status: "ignored" });
    return;
  }

  const signature = req.headers["x-razorpay-signature"] as string;
  if (!signature) {
    res.status(400).json({ error: "Missing signature header" });
    return;
  }

  const rawBody = (req as any).rawBody ?? "";

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSig !== signature) {
    logger.warn("Webhook signature mismatch — rejected");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  logger.info({ event: event.event }, "Razorpay webhook received");

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (!payment) { res.status(200).json({ status: "ok" }); return; }

    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Look up the pending payment record
    const paymentRow = await turso.execute({
      sql: `SELECT user_id, plan_id FROM payments WHERE order_id = ? AND status = 'pending'`,
      args: [orderId],
    });

    if (paymentRow.rows.length === 0) {
      // Already handled via /verify, or unknown order
      res.status(200).json({ status: "already_processed" });
      return;
    }

    const userId = String(paymentRow.rows[0][0]);
    const planId = String(paymentRow.rows[0][1]);

    if (!isPlanId(planId)) {
      logger.error({ planId }, "Unknown planId in webhook");
      res.status(200).json({ status: "ok" });
      return;
    }

    const plan = PLANS[planId];

    await turso.execute({
      sql: `UPDATE payments SET status = 'paid', payment_id = ? WHERE order_id = ?`,
      args: [paymentId, orderId],
    });

    await turso.execute({
      sql: `UPDATE users SET plan = ?, url_limit = ? WHERE id = ?`,
      args: [planId, plan.urlLimit, userId],
    });

    logger.info({ userId, planId, orderId }, "Plan upgraded via webhook");
  }

  res.status(200).json({ status: "ok" });
});

export default router;
