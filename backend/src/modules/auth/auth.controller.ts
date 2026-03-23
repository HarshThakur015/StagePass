import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../../models/User";
import { AppError } from "../../utils/errorHandler";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";

/**
 * Zod schema to validate user registration requests
 * Ensures required fields are present and valid (like email format and min password length)
 */
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
        role: z.enum(["user", "organizer", "verifier", "admin"]).optional(),
    }),
});

/**
 * Controller to handle new User Registration
 * 1. Checks if the user already exists by email
 * 2. Hashes the password securely via bcrypt
 * 3. Saves the newly created user document to the database
 * 4. Generates both Access and Refresh tokens
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, role, adminKey } = req.body;

        // Check if a user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError("Email is already registered", 400));
        }

        let finalRole = "user"; // default role

        // Hardcoded admin email logic
        if (email === "adminStagePass@mail.com") {
            finalRole = "admin";
        } else if (role === "organizer" || role === "verifier") {
            finalRole = role;
        } else if (role === "admin") {
            return next(new AppError("You are not allowed to register as an admin.", 403));
        }

        // Passwords should be hashed using bcrypt before saving to DB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user object
        const newUser = await User.create({
            email,
            password: hashedPassword,
            role: finalRole,
        });

        // Generate JWTs based on the new user's credentials
        const payload = { userId: newUser.id, role: newUser.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Respond with successful status, omitting password
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: { id: newUser.id, email: newUser.email, role: newUser.role },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Zod schema to validate user login requests
 */
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password is required"),
    }),
});

/**
 * Controller to handle User Login
 * 1. Finds the user by matching their email
 * 2. Checks password
 * 3. Returns tokens
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // We must `.select('+password')` because we initially hid it at the model level
        const user = await User.findOne({ email }).select("+password");

        // Validates existence and checks password
        if (!user || !(await bcrypt.compare(password, user.password as string))) {
            return next(new AppError("Invalid credentials", 401));
        }

        // Generate tokens
        const payload = { userId: user.id, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: { id: user.id, email: user.email, role: user.role },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Zod schema to validate token refresh requests
 */
export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, { message: "Refresh token is required" }),
    }),
});

/**
 * Controller to issue a new Access Token using a valid Refresh Token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        // Verify token
        const decoded = verifyRefreshToken(refreshToken);

        const payload = { userId: decoded.userId, role: decoded.role };
        const newAccessToken = generateAccessToken(payload);

        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: newAccessToken,
            },
        });
    } catch (error) {
        return next(new AppError("Invalid or expired refresh token", 401));
    }
};

/**
 * Controller to logout a user
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // In a stateless JWT implementation, actual token invalidation is usually handled by returning empty tokens or dropping them from the client side.
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
};
