import mongoose, { Schema, Document } from "mongoose";

// Interface defining the properties of a User document
export interface IUser extends Document {
    id: string; // Used commonly for mongoose virtual getter
    email: string;
    password?: string; // Optional because might be excluded in some queries
    role: "user" | "organizer" | "verifier" | "admin";
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema for the User model
const UserSchema: Schema = new Schema(
    {
        // Email must be unique and is required for authentication
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        // Password is used for local authentication, stored as a bcrypt hash
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false, // Do not return password by default in queries
        },
        // Role defines the user's permissions within the application
        role: {
            type: String,
            enum: ["user", "organizer", "verifier", "admin"],
            default: "user",
        },
    },
    {
        // Automatically manage createdAt and updatedAt timestamps
        timestamps: true,
    }
);

// Map the schema to a Mongoose model and export it
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
