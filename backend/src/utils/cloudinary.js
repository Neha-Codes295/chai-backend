import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: "auto",
        })
        // file uploaded successfully
        // console.log("File uploaded successfully", response.url);
        fs.unlinkSync(localfilePath)
        return response;
    }
    catch (error) {
        fs.unlinkSync(localfilePath); // delete the file from local storage as it failed to upload on cloudinary
        return null;
    }
}

/**
 * Public id = path after /upload/ (without file extension). Used with destroy().
 */
const extractPublicIdFromUrl = (url) => {
    if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
        return null;
    }
    try {
        const pathname = new URL(url).pathname;
        const marker = "/upload/";
        const idx = pathname.indexOf(marker);
        if (idx === -1) return null;
        let after = pathname.slice(idx + marker.length);
        if (/^v\d+\//.test(after)) {
            after = after.replace(/^v\d+\//, "");
        }
        return after.replace(/\.[^/.]+$/, "");
    } catch {
        return null;
    }
};

const deleteFromCloudinary = async (url, { resourceType = "image" } = {}) => {
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) return null;
    try {
        return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch {
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicIdFromUrl }