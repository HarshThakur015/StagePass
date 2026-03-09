import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Import Route Modules
import authRoutes from "./modules/auth/auth.routes";
import eventRoutes from "./modules/events/events.routes";
import ticketRoutes from "./modules/tickets/tickets.routes";
import adminRoutes from "./modules/admin/admin.routes";

// Import Global Error Handler
import { globalErrorHandler } from "./middleware/errorMiddleware";
import { AppError } from "./utils/errorHandler";

const app: Application = express();

// 1. GLOBAL MIDDLEWARES

// Set security HTTP headers but allow frontend to load images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable Cross-Origin Resource Sharing (CORS) for external frontend requests
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Allow cookies if needed
}));

// Apply basic rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
});
app.use("/api", limiter);

// Built-in middleware to parse JSON body payload (req.body)
app.use(express.json({ limit: "10kb" }));

// 2. MOUNT API ROUTES

// Root health check route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "StagePass API Running 🚀" });
});

// Auth Routes: handling login, register, refresh
app.use("/api/auth", authRoutes);

// Event Routes: handling creating, joining, viewing events
app.use("/api/events", eventRoutes);

// Ticket Routes: handling purchasing and scanning tickets
app.use("/api/tickets", ticketRoutes);

// Admin Routes: handling system-wide metrics and user inspection
app.use("/api/admin", adminRoutes);

// 3. UNHANDLED ROUTES HANDLER
// Catches requests to endpoints that do not exist
app.use((req: Request, res: Response, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. GLOBAL ERROR HANDLER
// All errors passed to next() will ultimately land here
app.use(globalErrorHandler);

export default app;