import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import { loginUser } from "./controllers/user.controller.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser())

// Primary login URL (use this in Postman).
app.post("/api/v1/users/login", loginUser);

// Alternate mount — try this if a proxy or client mangles the users path.
const authRouter = express.Router();
authRouter.post("/login", loginUser);
app.use("/api/v1/auth", authRouter);

app.use("/api/v1/users", userRouter);

app.use(express.static("public"))

export { app };
