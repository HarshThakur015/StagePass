import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { stripe } from "./payment.service";
import Event from "../../models/Event";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import { AppError } from "../../utils/errorHandler";
import { generateQRData } from "../../utils/qr";
import { sendTicketEmail } from "../../utils/email";

// Validates the checkout session creation request
export const createCheckoutSessionSchema = z.object({
    body: z.object({
        eventId: z.string().min(1, "Event ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Cannot buy more than 10 at once").optional().default(1),
    }),
});

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId, quantity } = req.body;
        const userId = req.user?._id || req.user?.id;
        
        if (!userId) {
            return next(new AppError("User not authenticated", 401));
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError("Event not found", 404));
        }

        // ---------------------------------------------------------------------

        // If the event is free, bypass Stripe entirely to avoid minimum charge errors
        if (event.price === 0) {
            return res.status(200).json({
                success: true,
                id: "free_event_" + Date.now(),
                url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?success=true`
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr", // Currency set to INR as requested
                        product_data: {
                            name: event.name || "Event Ticket",
                            description: "StagePass Event Ticket",
                        },
                        // Enforce Stripe's minimum equivalent of 50 cents (~₹40.00)
                        unit_amount: Math.max(Math.round(event.price * 100), 4000),
                    },
                    quantity: quantity,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
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

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers["stripe-signature"];

    let eventStripe;

    try {
        eventStripe = stripe.webhooks.constructEvent(
            req.body, // Raw body
            sig as string,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (eventStripe.type === "checkout.session.completed") {
        const session = eventStripe.data.object as any;
        console.log(`[Webhook] Payment successful for session ${session.id}!`);

        const { eventId, userId, quantity } = session.metadata;

        try {
            // Idempotency: skip if already processed synchronously by frontend
            const existingTickets = await Ticket.find({ stripeSessionId: session.id });
            if (existingTickets.length > 0) {
                console.log(`[Webhook] Tickets already exist for session ${session.id}, skipping regeneration.`);
                return res.status(200).json({ received: true });
            }

            const event = await Event.findById(eventId);
            if (!event) throw new Error("Event not found in webhook process");

            const ticketsToCreate = [];
            const timestamp = Date.now().toString();
            const numTickets = parseInt(quantity, 10);

            for (let i = 0; i < numTickets; i++) {
                const ticketId = crypto.randomBytes(8).toString("hex");
                const qrData = generateQRData({ ticketId, eventId, userId, timestamp });

                ticketsToCreate.push({
                    ticketId,
                    eventId,
                    userId,
                    qrData,
                    status: "valid",
                    stripeSessionId: session.id
                });
            }

            const savedTickets = await Ticket.insertMany(ticketsToCreate);
            const userObj = await User.findById(userId);

            if (userObj && userObj.email) {
                console.log(`[Email Debug] Dispatching post-payment email to ${userObj.email}`);
                await sendTicketEmail(userObj.email, savedTickets, event);
            }
        } catch (error) {
            console.error("[Webhook Error] Failed to generate tickets:", error);
        }
    }

    res.status(200).json({ received: true });
};

export const verifySession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user?._id || req.user?.id;

        if (!userId) return next(new AppError("User not authenticated", 401));
        if (!sessionId) return next(new AppError("Session ID is required", 400));

        // Idempotency check: see if tickets for this session already exist
        const existingTickets = await Ticket.find({ stripeSessionId: sessionId });
        if (existingTickets.length > 0) {
            return res.status(200).json({ success: true, message: "Tickets already issued", data: existingTickets });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session || session.payment_status !== "paid") {
            return next(new AppError("Payment not completed or session not found", 400));
        }

        const metadata = session.metadata;
        if (!metadata) return next(new AppError("Session missing metadata", 400));
        const { eventId, quantity } = metadata;

        const event = await Event.findById(eventId);
        if (!event) return next(new AppError("Event not found", 404));

        const ticketsToCreate = [];
        const timestamp = Date.now().toString();
        const numTickets = parseInt(quantity, 10);

        for (let i = 0; i < numTickets; i++) {
            const ticketId = crypto.randomBytes(8).toString("hex");
            const qrData = generateQRData({ ticketId, eventId, userId: userId.toString(), timestamp });

            ticketsToCreate.push({
                ticketId,
                eventId,
                userId: userId.toString(),
                qrData,
                status: "valid",
                stripeSessionId: sessionId
            });
        }

        const savedTickets = await Ticket.insertMany(ticketsToCreate);
        const userObj = await User.findById(userId);

        if (userObj && userObj.email) {
            console.log(`[Email Debug] Dispatching post-payment email to ${userObj.email} via verifySession`);
            await sendTicketEmail(userObj.email, savedTickets, event);
        }

        res.status(200).json({ success: true, message: "Tickets generated successfully", data: savedTickets });
    } catch (error) {
        next(error);
    }
};
