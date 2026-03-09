import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";

// Read configuration from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary using a stream.
 * 
 * @param buffer - The file buffer in memory from multer
 * @param folder - The Cloudinary folder to store the image in
 * @returns A promise that resolves with the Cloudinary Upload API Response
 */
export const uploadBufferToCloudinary = (buffer: Buffer, folder: string = "stagepass/events"): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error("Cloudinary upload failed without a clear error"));
                } else {
                    resolve(result);
                }
            }
        );

        // Pipe the memory buffer to the Cloudinary stream
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};
