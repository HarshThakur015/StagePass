import { Router } from "express";
import { getUsers, getAnalytics, getAllEvents, getAllTickets, deleteUser, updateUserRole } from "./admin.controller";
import { createEvent, updateEvent, deleteEvent, createEventSchema, updateEventSchema } from "../events/events.controller";
import { validateTicket, validateTicketSchema } from "../tickets/tickets.controller";
import { protect } from "../../middleware/authMiddleware";
import { restrictTo } from "../../middleware/roleMiddleware";
import { upload } from "../../middleware/upload";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

/**
 * All admin routes require strict authentication and 'admin' role permissions
 */
router.use(protect);
router.use(restrictTo("admin"));

/**
 * GET: Retrieve list of users
 */
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/role", updateUserRole);

/**
 * GET: Core Analytics Data (e.g. Total counts, Revenue)
 */
router.get("/analytics", getAnalytics);

/**
 * EVENTS MANAGEMENT
 */
router.get("/events", getAllEvents);
router.post(
    "/events",
    upload.array("images", 3),
    (req, res, next) => {
        if (req.body.capacity) req.body.capacity = Number(req.body.capacity);
        if (req.body.price) req.body.price = Number(req.body.price);
        next();
    },
    validateRequest(createEventSchema),
    createEvent
);
router.put("/events/:id", validateRequest(updateEventSchema), updateEvent);
router.delete("/events/:id", deleteEvent);

/**
 * TICKETS MANAGEMENT
 */
router.get("/tickets", getAllTickets);
router.post("/tickets/verify", validateRequest(validateTicketSchema), validateTicket);

export default router;
