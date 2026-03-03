import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import User, { IUser } from "../models/User";

// Extend the Express Request interface to include the attached user
declare global {
    namespace Express {
        interface Request {
            user?: IUser; // Attached when token is verified successfully
        }
    }
}

/**
 * Middleware to protect routes that require authentication
 * Extracts JWT from the Authorization header, verifies it, and attaches the user document mapped by userId
 * 
 * Flow:
 * 1. Checks for Authorization header (Bearer token)
 * 2. Tries to verify the token signature
 * 3. Finds the user in the database
 * 4. Attaches the user object to `req.user`
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // 1. Get token and check if it's there
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Handle case where no token is provided
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "You are not logged in! Please log in to get access.",
        });
    }

    try {
        // 2. Verification of the token based on the utility module
        const decoded: JwtPayload = verifyAccessToken(token);

        // 3. Check if user still exists after token was generated
        const currentUser = await User.findById(decoded.userId);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: "The user belonging to this token does no longer exist.",
            });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        // Attach the user (who requested) to the Request object to be retrieved later from `req.user`
        req.user = currentUser;
        next();
    } catch (err: any) {
        // 4. Verification threw an error (e.g. invalid signature, expired token)
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again.",
        });
    }
};
