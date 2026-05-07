// /api/v1/comments — list by video; add needs login; /c/:id for edit/delete.
import { Router } from "express"
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/:videoId").get(getVideoComments).post(verifyJWT, addComment) // GET public, POST auth
router.route("/c/:commentId").delete(verifyJWT, deleteComment).patch(verifyJWT, updateComment) // "c" so we do not clash with videoId shape

export default router
