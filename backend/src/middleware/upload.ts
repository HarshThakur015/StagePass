import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../utils/errorHandler";

// Ensure the target directory exists
const uploadDir = path.join(process.cwd(), "uploads/events");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory Storage vs Disk Storage
// We'll use diskStorage to automatically save files so we don't hold buffers in RAM
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        // Generate a random unique name for the file to prevent overwrites
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// Configure Multer middleware
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max per file
    },
    fileFilter: (req, file, cb) => {
        // Accept only image formats
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new AppError("Not an image! Please upload only images.", 400) as any, false);
        }
    },
});
