import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict route access based on user role
 * To be used AFTER the `protect` auth middleware (which populates `req.user`)
 * @param roles - An array of allowed roles to access the resource (e.g., ['admin', 'organizer'])
 * @returns - A middleware function capable of verifying the active user's role 
 */
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Check if the user is attached, and if their role is included in the allowed list
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action",
            });
        }

        // Role passes check, execute the next handler
        next();
    };
};
