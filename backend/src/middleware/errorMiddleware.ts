import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errorHandler";

/**
 * Global Error Handling Middleware
 * Centralized place to handle and format errors thrown anywhere in the system
 * Catches all next(err) invocations
 */
export const globalErrorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If the error object has a statusCode defined (e.g. from AppError) we use it, otherwise fallback to 500 (Internal Server Error)
    const statusCode = err instanceof AppError ? err.statusCode : 500;

    // Format the standard response envelope for failures
    const response: any = {
        success: false,
        message: err.message || "Internal Server Error",
    };

    // Log error stacks to help debug in non-production environments
    if (process.env.NODE_ENV !== "production") {
        response.stack = err.stack;
    }

    // Handle Mongoose specific errors if any exist
    if (err.name === "CastError") {
        response.message = "Invalid Resource ID";
        res.status(400).json(response);
        return;
    }

    if (err.name === "ValidationError") {
        response.message = "Mongoose Validation Error";
        res.status(400).json(response);
        return;
    }

    // Returns the formatted JSON response to the user terminal
    res.status(statusCode).json(response);
};
