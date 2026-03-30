export type PlanId = "starter" | "pro" | "business";

/**
 * All plans are YEARLY billing.
 * Amounts are in paise (INR × 100).
 * ₹499/yr, ₹999/yr, ₹1499/yr
 *
 * HOW TO ADD A NEW PLAN:
 * 1. Add the plan ID to the PlanId union type above.
 * 2. Add an entry to PLANS below with: name, amount (paise), urlLimit.
 * 3. Add the plan card to Pricing.tsx (frontend PLANS array).
 * 4. Run a DB migration if needed (url_limit is per-user, set on payment verify).
 * That's it — no other files need changing.
 */
export const PLANS: Record<PlanId, { name: string; amount: number; urlLimit: number }> = {
  starter: { name: "Starter",  amount: 5000,  urlLimit: 50  },
  pro:     { name: "Pro",      amount: 10000, urlLimit: 100 },
  business:{ name: "Business", amount: 15000, urlLimit: 200 },
};

export function isPlanId(value: string): value is PlanId {
  return Object.keys(PLANS).includes(value);
}
