import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import Ticket from "../../models/Ticket";
import Event from "../../models/Event";
import User from "../../models/User";
import { AppError } from "../../utils/errorHandler";
import { generateQRData, validateQRData } from "../../utils/qr";
import { sendTicketEmail } from "../../utils/email";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia" as any,
});

/**
 * Zod schema to validate ticket purchase
 */
export const purchaseTicketSchema = z.object({
    body: z.object({
        eventId: z.string().min(1, "Event ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Cannot buy more than 10 at once"),
    }),
});

/**
 * Controller to handle ticket purchases by users
 * Flow:
 * 1. Checks if the event exists and has enough capacity
 * 2. Generates unique ticketId per ticket
 * 3. Creates the QR Data string
 * 4. Saves the tickets
 * 5. Updates the capacity (this is a simplified transaction, ideally use Mongoose sessions for robust concurrency handling)
 */
export const purchase = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId, quantity } = req.body;
        const userId = req.user?._id || req.user?.id;

        // 1. Validate Event
        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError("Event not found", 404));
        }

        // 2. Simplistic capacity check based on tickets sold (In prod: use transactions/Atomic increments)
        const ticketsSold = await Ticket.countDocuments({ eventId });
        if (ticketsSold + quantity > event.capacity) {
            return next(new AppError("Not enough tickets available", 400));
        }

        // 3. Generate individual tickets
        const ticketsToCreate = [];
        const timestamp = Date.now().toString();

        for (let i = 0; i < quantity; i++) {
            // Creates a randomized unique ID for the ticket
            const ticketId = crypto.randomBytes(8).toString("hex");

            // Builds the QR Payload using the utility module
            const qrData = generateQRData({
                ticketId,
                eventId,
                userId: userId?.toString() as string,
                timestamp,
            });

            ticketsToCreate.push({
                ticketId,
                eventId,
                userId: userId?.toString() as string,
                qrData,
                status: "valid",
            });
        }

        // Batch insert for performance
        const savedTickets = await Ticket.insertMany(ticketsToCreate);

        // Send email with tickets attached
        let emailSent = false;
        console.log(`[Email Debug] Attempting to send email for userId: ${userId}`);
        const user = await User.findById(userId);

        if (!user) {
            console.log(`[Email Debug] User not found in DB for userId: ${userId}`);
        } else if (!user.email) {
            console.log(`[Email Debug] User found but missing email field.`);
        } else {
            console.log(`[Email Debug] Found user email: ${user.email}. Dispatching nodemailer...`);
            const emailResult = await sendTicketEmail(user.email, savedTickets, event);
            emailSent = emailResult.success;
            console.log(`[Email Debug] Nodemailer dispatch result: ${emailSent}`);
        }

        res.status(201).json({
            success: true,
            message: `Successfully purchased ${quantity} ticket(s)`,
            emailSent, // Pass the email status flag to the frontend
            data: savedTickets,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch the authenticated user's tickets
 */
export const myTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id || req.user?.id;

        // Finds tickets and populates the related Event data (name, date, venue) to display on the Frontend UI
        const tickets = await Ticket.find({ userId })
            .populate("eventId", "name date venue price")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tickets,
            count: tickets.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Zod schema to validate QR scanning validation requests
 */
export const validateTicketSchema = z.object({
    body: z.object({
        qrData: z.string().min(1, "QR Data string is required"),
    }),
});

/**
 * Controller to validate a ticket dynamically at the gate
 * To be used explicitly by Verifier roles via their Scanner Dashboard.
 * 
 * Flow:
 * 1. Decode and check signature of the `qrData` parameter (prevent forged tickets)
 * 2. Lookup ticket in DB by ID
 * 3. Ensure it's not already used or expired
 * 4. Update status to 'used' if valid
 */
export const validateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { qrData } = req.body;

        // 1. Decode & Cryptographically verify the signature
        // validateQRData throws an Error if tampered
        let decodedData;
        try {
            decodedData = validateQRData(qrData);
        } catch (err: any) {
            return next(new AppError(err.message || "Invalid QR Code", 400));
        }

        const { ticketId, eventId } = decodedData;

        // 2. Fetch the Ticket from Database
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return next(new AppError("Ticket not found in system", 404));
        }

        // Extra cross-check to enforce absolute match
        if (ticket.eventId.toString() !== eventId) {
            return next(new AppError("Ticket does not match the event", 400));
        }

        // 3. Status checks
        if (ticket.status === "used") {
            return res.status(400).json({
                success: false,
                message: "This ticket has already been USED",
                data: ticket,
            });
        }

        if (ticket.status === "expired") {
            return res.status(400).json({
                success: false,
                message: "This ticket is EXPIRED",
                data: ticket,
            });
        }

        // 4. Update the ticket as used
        ticket.status = "used";
        ticket.usedAt = new Date();
        await ticket.save();

        res.status(200).json({
            success: true,
            message: "Ticket VALID and marked as used.",
            data: ticket,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to create a Stripe Checkout Session
 */
export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId, quantity } = req.body;
        const userId = req.user?._id || req.user?.id;
        
        if (!userId) {
            return next(new AppError("User not authenticated", 401));
        }

        // 1. Validate Event
        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError("Event not found", 404));
        }

        // 2. Capacity check
        const ticketsSold = await Ticket.countDocuments({ eventId });
        if (ticketsSold + quantity > event.capacity) {
            return next(new AppError("Not enough tickets available", 400));
        }

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: event.name || "Event Ticket",
                            description: "StagePass Ticket",
                        },
                        unit_amount: Math.round(event.price * 100), // Stripe expects cents
                    },
                    quantity: quantity,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?success=true`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/events/${eventId}?canceled=true`,
            metadata: {
                eventId: event._id.toString(),
                userId: userId.toString(),
                quantity: quantity.toString(),
            },
        });

        res.status(200).json({
            success: true,
            id: session.id,
            url: session.url
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to handle Stripe Webhooks
 */
export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers["stripe-signature"];

    let eventStripe;

    try {
        eventStripe = stripe.webhooks.constructEvent(
            req.body, // This is the raw buffer since we used express.raw in app.ts
            sig as string,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (eventStripe.type === "checkout.session.completed") {
        const session = eventStripe.data.object as any;
        
        try {
            const eventId = session.metadata.eventId;
            const userId = session.metadata.userId;
            const quantity = parseInt(session.metadata.quantity, 10);

            const event = await Event.findById(eventId);
            if (!event) throw new Error("Event not found during webhook processing");

            // Generate individual tickets
            const ticketsToCreate = [];
            const timestamp = Date.now().toString();

            for (let i = 0; i < quantity; i++) {
                const ticketId = crypto.randomBytes(8).toString("hex");

                const qrData = generateQRData({
                    ticketId,
                    eventId,
                    userId,
                    timestamp,
                });

                ticketsToCreate.push({
                    ticketId,
                    eventId,
                    userId,
                    qrData,
                    status: "valid",
                });
            }

            // Batch insert tickets
            const savedTickets = await Ticket.insertMany(ticketsToCreate);

            // Send Email
            const user = await User.findById(userId);
            if (user && user.email) {
                console.log(`[Webhook] Dispatching email to ${user.email}`);
                await sendTicketEmail(user.email, savedTickets, event);
            }

        } catch (error) {
            console.error("Error processing successful payment:", error);
            return res.status(500).send("Internal Server Error processing webhook");
        }
    }

    res.status(200).json({ received: true });
};
