import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Event from "../../models/Event";
import Ticket from "../../models/Ticket";
import { AppError } from "../../utils/errorHandler";

/**
 * Zod schema to validate event creation requests
 * Ensures required fields like name, date, venue, capacity, price exist
 */
export const createEventSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Event name must be at least 3 characters long"),
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
        venue: z.string().min(3, "Venue must be at least 3 characters long"),
        capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
        price: z.coerce.number().min(0, "Price cannot be negative"),
    }),
});

/**
 * Controller to create a new event
 * Only accessible by Organizer or Admin roles.
 */
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract validated body content
        const { name, date, venue, capacity, price } = req.body;

        // The organizer is the currently authenticated user attached by the `protect` middleware
        const organizerId = (req.user?._id || req.user?.id);

        // Check if images were uploaded
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return next(new AppError("You must upload at least 1 image", 400));
        }

        // Map files to their static URLs
        const images = files.map((file) => `/uploads/events/${file.filename}`);

        // Save event document to the database
        const newEvent = await Event.create({
            name,
            date: new Date(date),
            venue,
            capacity,
            price,
            images,
            organizerId,
        });

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: newEvent,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch all public events
 * Could be expanded with pagination or filtering (by date, name, etc.)
 */
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Find all events, sort by closest date first
        // Exclude events that have already passed if needed, but for now we list all.
        // Populate the organizer details (only name or email, omit sensitive info) if we wanted to
        // but the schema doesn't have a name, so let's just populate role / email
        const events = await Event.find()
            .populate("organizerId", "email role")
            .sort({ date: 1 });

        // We need to attach `ticketsLeft` to each event dynamically
        // Use Promise.all to fetch ticket counts concurrently
        const eventsWithTicketsLeft = await Promise.all(
            events.map(async (ev) => {
                const sold = await Ticket.countDocuments({ eventId: ev._id });
                return {
                    ...ev.toObject(),
                    ticketsLeft: Math.max(0, ev.capacity - sold),
                };
            })
        );

        res.status(200).json({
            success: true,
            data: eventsWithTicketsLeft,
            count: events.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch details of a single event by its ID
 */
export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id).populate("organizerId", "email role");

        if (!event) {
            return next(new AppError("Event not found", 404));
        }

        const sold = await Ticket.countDocuments({ eventId: event._id });
        const ticketsLeft = Math.max(0, event.capacity - sold);

        res.status(200).json({
            success: true,
            data: {
                ...event.toObject(),
                ticketsLeft,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Zod schema to validate event update requests
 */
export const updateEventSchema = z.object({
    body: z.object({
        name: z.string().min(3).optional(),
        date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }).optional(),
        venue: z.string().min(3).optional(),
        capacity: z.number().int().positive().optional(),
        price: z.number().min(0).optional(),
    }),
});

/**
 * Controller to update an existing event
 * Important constraint: Only the organizer who created it (or an Admin) can edit it
 */
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Find the event first to check ownership
        const event = await Event.findById(id);

        if (!event) {
            return next(new AppError("Event not found", 404));
        }

        // Check ownership: req.user exists because this route is protected
        // Only allow update if the user's ID matches organizerId, OR if user is an admin
        if (event.organizerId.toString() !== (req.user?._id || req.user?.id) && req.user?.role !== "admin") {
            return next(new AppError("Not authorized to update this event", 403));
        }

        // Update document in database and return the newly updated version (`new: true`)
        const updatedEvent = await Event.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: updatedEvent,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to delete an event
 * Important constraint: Only the organizer who created it (or an Admin) can delete it
 */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return next(new AppError("Event not found", 404));
        }

        // Checking authorization explicitly
        if (event.organizerId.toString() !== (req.user?._id || req.user?.id) && req.user?.role !== "admin") {
            return next(new AppError("Not authorized to delete this event", 403));
        }

        await event.deleteOne();

        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
            data: null,
        });
    } catch (error) {
        next(error);
    }
};
