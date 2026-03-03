import crypto from "crypto";

/**
 * Interface representing the data used to generate a secure QR string
 */
export interface TicketQRData {
    ticketId: string;
    eventId: string;
    userId: string;
    timestamp: string;
}

/**
 * Secret key used to generate a HMAC seal against tampering
 * In production, ensure this is a strong secret from process.env
 */
const QR_SECRET = process.env.JWT_SECRET || "fallback_qr_secret_salt";

/**
 * Generates a secure, deterministic, tamper-proof QR data string
 * @param data - The components of the ticket
 * @returns A base64 encoded string containing the ticket data and a signature
 */
export const generateQRData = (data: TicketQRData): string => {
    // Concatenate identifying parameters to form the base string
    const baseString = `${data.ticketId}:${data.eventId}:${data.userId}:${data.timestamp}`;

    // Creates a cryptographically strong hash of the parameters to prevent tampering
    const signature = crypto
        .createHmac("sha256", QR_SECRET)
        .update(baseString)
        .digest("hex");

    // The final QR string includes the base string and the signature
    const finalString = `${baseString}|${signature}`;

    // Encode as Base64 to make it compact and easily pass through URLs or QR code generic readers
    return Buffer.from(finalString).toString("base64");
};

/**
 * Validates a scanned QR data string against tampering
 * @param qrString - The base64 string from the QR code
 * @returns The parsed ticket data, or throws an error if invalid
 */
export const validateQRData = (qrString: string): TicketQRData => {
    try {
        // Decode the base64 string back into plaintext
        const decoded = Buffer.from(qrString, "base64").toString("utf-8");

        // Split the final string back into data and signature
        const [baseString, signature] = decoded.split("|");
        if (!baseString || !signature) {
            throw new Error("Invalid format");
        }

        // Recalculate the expected signature using the server's secret
        const expectedSignature = crypto
            .createHmac("sha256", QR_SECRET)
            .update(baseString)
            .digest("hex");

        // The calculated signature must exactly match the provided signature
        if (signature !== expectedSignature) {
            throw new Error("Signature mismatch! Data may be tampered.");
        }

        // Split out the original parameters from the base string
        const [ticketId, eventId, userId, timestamp] = baseString.split(":");
        return { ticketId, eventId, userId, timestamp };
    } catch (error) {
        throw new Error("Invalid or corrupted QR Data");
    }
};
