import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 8001;

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error connecting to MongoDB:", error);
            throw error;
        });
        app.listen(port, () => {
            console.log(`app listening on http://localhost:${port}`);
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