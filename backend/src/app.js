import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import { loginUser } from "./controllers/user.controller.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// Correct TLS / client IP when behind Render, Fly, Railway, etc.
app.set("trust proxy", 1);

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

// API v1: each folder is one feature (REST-style paths inside each router).
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);

app.use(express.static("public"))

// Global error handler (thrown ApiError + async next(err))
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const statusCode = err?.statusCode ?? 500
  const message = err?.message || "Internal server error"
  if (res.headersSent) {
    return
  }
  return res.status(statusCode).json(
    err instanceof ApiError
      ? {
        success: false,
        message,
        errors: err.errors ?? [],
      }
      : {
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : message,
      }
  )
})

export { app };
