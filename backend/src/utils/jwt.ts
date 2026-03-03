import jwt from "jsonwebtoken";

// Load secrets from environment variables, fallback is only for development safety
// In production, an error should be thrown if these are not set
const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_key";

// Interface for what we store inside the JWT payload
export interface JwtPayload {
    userId: string;
    role: string;
}

/**
 * Generates a short-lived Access Token
 * @param payload - The data to embed in the token (userId, role)
 * @returns - A signed JWT string valid for 15 minutes
 */
export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "15m", // Specification defines 15 minutes for access tokens
    });
};

/**
 * Generates a long-lived Refresh Token
 * @param payload - The data to embed in the token (userId, role)
 * @returns - A signed JWT string valid for 7 days
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: "7d", // Specification defines 7 days for refresh tokens
    });
};

/**
 * Verifies and decodes an Access Token
 * @param token - The JWT string to verify
 * @returns - The decoded payload if valid, otherwise throws an error
 */
export const verifyAccessToken = (token: string): JwtPayload => {
    // jwt.verify throws error if token is invalid or expired
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

/**
 * Verifies and decodes a Refresh Token
 * @param token - The JWT string to verify
 * @returns - The decoded payload if valid, otherwise throws an error
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
    // jwt.verify throws error if token is invalid or expired
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
};
