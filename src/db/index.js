import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
        console.log(`\n MongoDB Connected!! DB Host : ${connectionInstance.connection.host} \n`);
    }
    catch (error) {
        console.log("Failed connecting to MongoDB:", error);
        process.exit(1); // Exit the process with an error code , instead of throwing the error, we log it and exit the process to prevent the application from running without a database connection.
    }
}

export default connectDB;