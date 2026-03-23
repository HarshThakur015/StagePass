import express from "express";
import { createCheckoutSession, stripeWebhook, createCheckoutSessionSchema, verifySession } from "./payment.controller";
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateRequest";

const router = express.Router();

// 8. Protect route with auth middleware (user must be logged in)
// Validate request using Zod
router.post(
    "/create-checkout-session",
    protect,
    validateRequest(createCheckoutSessionSchema),
    createCheckoutSession
);

// We don't protect the webhook since Stripe calls it directly.
// Note: Since this needs the raw body to verify the signature, ensure express.raw() is mapped to this route in app.ts!
router.post("/webhook", stripeWebhook);

// Synchronous session verification route for successful redirects
router.post(
    "/verify-session",
    protect,
    verifySession
);

export default router;
