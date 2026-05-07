// /api/v1/tweets — GET /u/:userId before /:tweetId so paths stay clear.
import { Router } from "express"
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/", verifyJWT, createTweet)
router.get("/u/:userId", getUserTweets) // public feed of one user
router
  .route("/:tweetId")
  .patch(verifyJWT, updateTweet)
  .delete(verifyJWT, deleteTweet) // also deletes tweet likes

export default router
