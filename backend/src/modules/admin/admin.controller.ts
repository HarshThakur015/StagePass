import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import Event from "../../models/Event";
import Ticket from "../../models/Ticket";
import { AppError } from "../../utils/errorHandler";


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

/**
 * Controller to fetch all events without constraints
 * Admin exclusive
 */
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await Event.find()
            .populate("organizerId", "email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: events,
            count: events.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch all tickets across the entire platform
 * Admin exclusive
 */
export const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tickets = await Ticket.find()
            .populate("eventId", "name date venue")
            .populate("userId", "email role")
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
 * Controller to explicitly delete a user
 * Admin only
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return next(new AppError("User not found", 404));
        if (user.role === "admin") return next(new AppError("You cannot delete other admins.", 403));

        await user.deleteOne();
        res.status(200).json({ success: true, message: "User cleanly deleted" });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to explicitly update a user's role
 * Admin only
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return next(new AppError("User not found", 404));
        if (user.role === "admin") return next(new AppError("Cannot change an admin's role", 403));

        user.role = role;
        await user.save();
        
        const userObject = user.toObject();
        delete userObject.password;

        res.status(200).json({ success: true, message: "Role updated successfully", data: userObject });
    } catch (error) {
        next(error);
    }
};
