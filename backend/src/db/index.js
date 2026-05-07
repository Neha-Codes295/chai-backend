import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI?.trim()
        if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
            console.error(
                "MONGODB_URI is missing or invalid. It must start with mongodb:// or mongodb+srv://",
                "\nExample local: mongodb://127.0.0.1:27017",
                "\nSet it in backend/.env (copy from .env.sample).",
            )
            process.exit(1)
        }
        const connectionInstance = await mongoose.connect(`${uri}/${DB_Name}`);
        console.log(`\n MongoDB Connected!! DB Host : ${connectionInstance.connection.host} \n`);
    }
    catch (error) {
        console.log("Failed connecting to MongoDB:", error);
        process.exit(1); // Exit the process with an error code , instead of throwing the error, we log it and exit the process to prevent the application from running without a database connection.
    }
}

export default connectDB;