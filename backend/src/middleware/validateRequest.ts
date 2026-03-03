import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validation Middleware using Zod Schema
 * Accepts a specific schema defining req.body, req.query, or req.params
 * Evaluates the incoming request and either passes it along, or halts execution and returns a 400 Bad Request if invalid
 * 
 * @param schema - A compiled Zod object schema representing the requirement constraints
 */
export const validateRequest = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Parses the incoming request asynchronously.
            // If valid, properties will be stripped and parsed safely to expected types.
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // Valid structure, continue to the next piece of middleware
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Formats the error array returned by zod
                // Maps it out nicely so the frontend could understand standard JSON responses
                const errorMessages = error.issues.map((issue: any) => ({
                    message: `${issue.path.join(".")} is ${issue.message}`,
                }));

                res.status(400).json({
                    success: false,
                    message: "Invalid input data",
                    errors: errorMessages,
                });
            } else {
                res.status(500).json({ success: false, message: "Internal Server Error" });
            }
        }
    };
};
