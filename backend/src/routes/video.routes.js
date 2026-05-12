// Route order: /my and /:videoId/publish before /:videoId (never use /videos/:literal paths).
import { Router } from "express"
import {
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    getMyVideos,
    togglePublishStatus,
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { optionalAuth, verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/").get(getAllVideos)

router.route("/my").get(verifyJWT, getMyVideos)

router
    .route("/:videoId/publish")
    .patch(verifyJWT, togglePublishStatus)

router.route("/:videoId").get(optionalAuth, getVideoById)

router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishVideo
)

router.route("/:videoId").patch(verifyJWT, updateVideo).delete(verifyJWT, deleteVideo)

export default router
