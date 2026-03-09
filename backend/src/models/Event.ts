import mongoose, { Schema, Document } from "mongoose";

// Interface defining the properties of an Event document
export interface IEvent extends Document {
    name: string;
    date: Date;
    venue: string;
    capacity: number;
    price: number;
    images: string[];
    organizerId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema for the Event model
const EventSchema: Schema = new Schema(
    {
        // The name/title of the event
        name: {
            type: String,
            required: [true, "Event name is required"],
            trim: true,
        },
        // The date and time when the event takes place
        date: {
            type: Date,
            required: [true, "Event date is required"],
        },
        // The physical or virtual location of the event
        venue: {
            type: String,
            required: [true, "Event venue is required"],
            trim: true,
        },
        // Maximum number of attendees allowed
        capacity: {
            type: Number,
            required: [true, "Event capacity is required"],
            min: [1, "Capacity must be at least 1"],
        },
        // Ticket price for the event. 0 means free.
        price: {
            type: Number,
            required: [true, "Event price is required"],
            min: [0, "Price cannot be negative"],
        },
        // Uploaded event imagery (between 1 and 3 photos required)
        images: {
            type: [String],
            required: [true, "Event images are required"],
            validate: [
                (val: string[]) => val.length >= 1 && val.length <= 3,
                "An event must have between 1 and 3 images",
            ],
        },
        // Reference to the User (role: organizer) who created the event
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Organizer ID is required"],
        },
    },
    {
        // Automatically manage createdAt and updatedAt timestamps
        timestamps: true,
    }
);

// Map the schema to a Mongoose model and export it
const Event = mongoose.model<IEvent>("Event", EventSchema);
export default Event;
