import { Router } from "express";
import {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
    createEventSchema,
    updateEventSchema
} from "./events.controller";
import { protect } from "../../middleware/authMiddleware";
import { restrictTo } from "../../middleware/roleMiddleware";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/upload";

const router = Router();

/**
 * Public Routes
 * Everyone can view the list of events and details for a specific event
 */
router.get("/", getEvents);
router.get("/:id", getEvent);

/**
 * Protected Routes
 * These routes require the user to be logged in (protect middleware)
 */
router.use(protect);

/**
 * Restricted Routes
 * Only 'organizer' or 'admin' roles can create, update, or delete events
 */
router.post(
    "/",
    restrictTo("organizer", "admin"),
    upload.array("images", 3), // Expect up to 3 files under 'images' field
    // Middleware to parse strings into numbers since we are receiving multipart/form-data
    (req, res, next) => {
        if (req.body.capacity) req.body.capacity = Number(req.body.capacity);
        if (req.body.price) req.body.price = Number(req.body.price);
        next();
    },
    validateRequest(createEventSchema),
    createEvent
);

router.put(
    "/:id",
    restrictTo("organizer", "admin"),
    validateRequest(updateEventSchema),
    updateEvent
);

router.delete(
    "/:id",
    restrictTo("organizer", "admin"),
    deleteEvent
);

export default router;
