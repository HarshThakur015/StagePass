import { Router } from "express";
import { register, login, refresh, logout, registerSchema, loginSchema, refreshSchema } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

/**
 * POST /api/auth/register
 * Registers a new user with email and password
 * Validated against registerSchema to ensure valid email and password format
 */
router.post("/register", validateRequest(registerSchema), register);

/**
 * POST /api/auth/login
 * Evaluates credentials and returns JWT access + refresh tokens
 * Validated against loginSchema
 */
router.post("/login", validateRequest(loginSchema), login);

/**
 * POST /api/auth/refresh
 * Takes a valid refresh token and returns a new 15m access token
 * Validated to ensure `refreshToken` property exists
 */
router.post("/refresh", validateRequest(refreshSchema), refresh);

/**
 * POST /api/auth/logout
 * De-authenticates a user (primarily a client-side cleanup action)
 */
router.post("/logout", logout);

export default router;
