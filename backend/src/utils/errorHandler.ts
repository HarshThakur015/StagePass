/**
 * Custom error class to represent operational errors that we can predict and handle.
 * Extending the built-in Error class allows us to attach an HTTP status code.
 */
export class AppError extends Error {
    public statusCode: number;
    public success: boolean;

    /**
     * Constructs a new AppError instance.
     * @param message - The error message to return to the client
     * @param statusCode - The HTTP status code (e.g., 400 for Bad Request, 404 for Not Found)
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        // Operational errors mean predictable failure (e.g. invalid credentials)
        // The success flag is always false
        this.success = false;

        // Captures the stack trace, excluding the constructor call for cleaner logs
        Error.captureStackTrace(this, this.constructor);
    }
}
