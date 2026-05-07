// /api/v1/likes — all routes need login. Short paths: v / c / t.
import { Router } from "express"
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos,
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT) // every like action needs a user
router.get("/videos", getLikedVideos) // paged list of videos I liked
router.post("/v/:videoId", toggleVideoLike)
router.post("/c/:commentId", toggleCommentLike)
router.post("/t/:tweetId", toggleTweetLike)

export default router
