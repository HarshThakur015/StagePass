import { Router } from "express";
import { purchase, myTickets, validateTicket, purchaseTicketSchema, validateTicketSchema } from "./tickets.controller";
import { protect } from "../../middleware/authMiddleware";
import { restrictTo } from "../../middleware/roleMiddleware";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

/**
 * All remaining ticket routes require authentication
 */
router.use(protect);

/**
 * User routes
 */
// GET: Retrieve own tickets
router.get("/my-tickets", restrictTo("user", "admin"), myTickets);

// POST: Buy tickets to an event (direct DB generation)
router.post(
    "/purchase",
    restrictTo("user", "admin"),
    validateRequest(purchaseTicketSchema),
    purchase
);

/**
 * Verifier Routes
 * Used specifically at event gates to scan and assert ticket validity
 */
// POST: Validates QR string and marks as used
router.post(
    "/validate",
    restrictTo("verifier", "admin"),
    validateRequest(validateTicketSchema),
    validateTicket
);

export default router;
