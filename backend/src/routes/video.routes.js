// /api/v1/videos — order: /my and /:id/publish before /:videoId so paths match right.
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

router.route("/").get(getAllVideos) // public home list

router.route("/my").get(verifyJWT, getMyVideos) // only my uploads (paged)

// Draft/public flip; must be more specific than plain /:videoId
router
    .route("/:videoId/publish")
    .patch(verifyJWT, togglePublishStatus)

router.route("/:videoId").get(optionalAuth, getVideoById) // guest ok; owner can see draft

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
