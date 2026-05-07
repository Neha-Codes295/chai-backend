// /api/v1/playlists — /u/:userId must stay above /:playlistId so "u" is not read as an id.
import { Router } from "express"
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/", verifyJWT, createPlaylist)
router.get("/u/:userId", getUserPlaylists) // one user's playlists
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(verifyJWT, updatePlaylist)
  .delete(verifyJWT, deletePlaylist)
router
  .route("/:playlistId/videos/:videoId")
  .post(verifyJWT, addVideoToPlaylist) // add or ignore if already there
  .delete(verifyJWT, removeVideoFromPlaylist)

export default router
