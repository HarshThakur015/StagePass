import Stripe from "stripe";

// Initialize Stripe in a separate config/util file (or service as requested)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia" as any,
});
