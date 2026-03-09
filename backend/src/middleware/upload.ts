import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../utils/errorHandler";

// Use Memory Storage so files are kept in RAM buffers and not written to disk
const storage = multer.memoryStorage();

// Configure Multer middleware
export const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max per file (to stay safely under MongoDB 16MB document limit)
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
