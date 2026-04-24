import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import e from 'express';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
    // check other via ctrl + space

}));

app.use(express.json({ limit: "16kb" }));

// url se bhi data ata h 
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());


// routes import
import userRouter from "./routes/user.routes.js"


// routes declaration
app.use("/api/v1/users", userRouter)
// http://localhost:8000/api/v1/users/register

export { app };