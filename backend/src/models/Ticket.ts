import mongoose, { Schema, Document } from "mongoose";

// Interface defining the properties of a Ticket document
export interface ITicket extends Document {
    ticketId: string; // A unique readable ID or hash
    eventId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    status: "valid" | "used" | "expired";
    qrData: string; // The data string embedded in the QR Code
    usedAt?: Date; // Timestamp when the ticket was successfully scanned/validated
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema for the Ticket model
const TicketSchema: Schema = new Schema(
    {
        // A specific unique identifier for this ticket instance
        ticketId: {
            type: String,
            required: [true, "Ticket ID is required"],
            unique: true,
            index: true,
        },
        // Reference to the Event this ticket is for
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
            required: [true, "Event ID is required"],
        },
        // Reference to the User who purchased/owns this ticket
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        // Current status of the ticket. Transitions from valid -> used or valid -> expired
        status: {
            type: String,
            enum: ["valid", "used", "expired"],
            default: "valid",
        },
        // The encoded data generated specifically to be read by the QR Scanner
        qrData: {
            type: String,
            required: [true, "QR Data is required"],
            unique: true,
        },
        // Recorded when the ticket status changes to 'used'
        usedAt: {
            type: Date,
        },
    },
    {
        // Automatically manage createdAt and updatedAt timestamps
        timestamps: true,
    }
);

// Map the schema to a Mongoose model and export it
const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
export default Ticket;
