// require("dotenv").config({path: "./env"});
// for consistency
import dotenv from "dotenv";

// import mongoose from "mongoose";
// import {DB_Name} from "./constants";
// import express from "express";
// const app = express();
import connectDB from "./db/index.js";

dotenv.config({ path: ".env" });
// use dev script in package.json


connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("Error connecting to MongoDB:", error);
        throw error;
    }); 
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App is Listening on port ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    throw err;
});





// function connectDB() {}
// connectDB();




/*
// more professional: iffi
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);

        // listen
        app.on("error", (error) => {
            console.log("Error connecting to MongoDB:", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is Listening on port ${process.env.PORT}`);
        });
    }
    catch (error) {
        // console.log(error);
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()
*/