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
                        // Enforce Stripe's minimum equivalent of 50 cents (~₹40.00)
                        unit_amount: Math.max(Math.round(event.price * 100), 4000),
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

        // --- OPTIMISTIC BOOKING: Generate tickets & send email IMMEDIATELY ---
        // This ensures the user gets their tickets and email without needing a webhook!
        const ticketsToCreate = [];
        const timestamp = Date.now().toString();

        for (let i = 0; i < quantity; i++) {
            const ticketId = crypto.randomBytes(8).toString("hex");
            const qrData = generateQRData({ ticketId, eventId, userId: userId.toString(), timestamp });

            ticketsToCreate.push({
                ticketId,
                eventId,
                userId,
                qrData,
                status: "valid", 
            });
        }

        const savedTickets = await Ticket.insertMany(ticketsToCreate);

        const userObj = await User.findById(userId);
        if (userObj && userObj.email) {
            console.log(`[Email Debug] Dispatching optimistic email to ${userObj.email}`);
            await sendTicketEmail(userObj.email, savedTickets, event);
        }
        // ---------------------------------------------------------------------

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
        console.log(`[Webhook] Payment successful for session ${session.id}! Tickets were already issued optimistically.`);
    }

    res.status(200).json({ received: true });
};
