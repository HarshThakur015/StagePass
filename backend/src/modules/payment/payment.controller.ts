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
                        unit_amount: Math.round(event.price * 100), // Convert price to paise
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
        
        try {
            const eventId = session.metadata.eventId;
            const userId = session.metadata.userId;
            const quantity = parseInt(session.metadata.quantity || "1", 10);

            const event = await Event.findById(eventId);
            if (!event) throw new Error("Event not found");

            const ticketsToCreate = [];
            const timestamp = Date.now().toString();

            for (let i = 0; i < quantity; i++) {
                const ticketId = crypto.randomBytes(8).toString("hex");

                // Bonus: Add QR code generation after successful payment
                const qrData = generateQRData({ ticketId, eventId, userId, timestamp });

                // Create booking in MongoDB mapping / Store ticket status
                ticketsToCreate.push({
                    ticketId,
                    eventId,
                    userId,
                    qrData,
                    status: "valid", // Set initial status
                });
            }

            const savedTickets = await Ticket.insertMany(ticketsToCreate);

            const user = await User.findById(userId);
            if (user && user.email) {
                await sendTicketEmail(user.email, savedTickets, event);
            }

        } catch (error) {
            console.error("Error processing webhook payment success:", error);
            // Must return 200 to Stripe even if our DB logic fails to avoid webhook retries blocking, 
            // but ideally we queue this or return 500 so Stripe retries it. Using 500 for strict correctness.
            return res.status(500).send("Internal Server Error processing webhook");
        }
    }

    res.status(200).json({ received: true });
};
