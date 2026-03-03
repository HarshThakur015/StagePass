import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import Event from "../../models/Event";
import Ticket from "../../models/Ticket";

/**
 * Controller to fetch all registered users
 * Only accessible by 'admin' role
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Return all users, omitting their passwords for safety
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: users,
            count: users.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch platform-wide analytics
 * Gathers aggregate data to power the Admin Dashboard UI charts
 */
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Execute multiple queries concurrently for optimal performance
        const [
            totalUsers,
            totalEvents,
            totalTickets,
            usedTickets,
            revenueStats
        ] = await Promise.all([
            User.countDocuments(),
            Event.countDocuments(),
            Ticket.countDocuments(),
            Ticket.countDocuments({ status: "used" }),

            // Perform a MongoDB aggregation to calculate total potential revenue across all sold tickets
            // By joining (lookup) Ticket against Event and summing the ticket prices
            Ticket.aggregate([
                {
                    $lookup: {
                        from: "events", // Target collection
                        localField: "eventId",
                        foreignField: "_id",
                        as: "eventDetails",
                    },
                },
                // Unwind the array created by $lookup
                { $unwind: "$eventDetails" },
                // Group everything into a single document holding the total sum
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$eventDetails.price" },
                    },
                },
            ]),
        ]);

        // Extract revenue from aggregate result, default to 0 if no tickets sold
        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
                totalTickets,
                usedTickets,
                totalRevenue,
            },
        });
    } catch (error) {
        next(error);
    }
};
