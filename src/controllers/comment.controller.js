// Comments on videos: list (public), add (login), edit/delete own (login).
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"

// Get paginated comments for one video, newest first.
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  // ?page=1&limit=10 from query
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }
  const video = await Video.exists({ _id: videoId })
  if (!video) {
    throw new ApiError(404, "Video not found")
  }
  const total = await Comment.countDocuments({ video: videoId })
  const list = await Comment.find({ video: videoId })
    .populate("owner", "fullname username avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
  return res.status(200).json(
    new ApiResponse(200, { data: list, page, limit, total }, "Comments fetched")
  )
})

// Logged-in user posts a new comment on a video.
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { content } = req.body
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }
  const v = await Video.findById(videoId).select("_id")
  if (!v) {
    throw new ApiError(404, "Video not found")
  }
  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  })
  const out = await Comment.findById(comment._id)
    .populate("owner", "fullname username avatar")
    .lean()
  return res.status(201).json(new ApiResponse(201, out, "Comment added"))
})

// Only the comment author can change the text.
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id")
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }
  const c = await Comment.findById(commentId)
  if (!c) {
    throw new ApiError(404, "Comment not found")
  }
  if (String(c.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed to update this comment")
  }
  c.content = content.trim()
  await c.save()
  const out = await Comment.findById(c._id)
    .populate("owner", "fullname username avatar")
    .lean()
  return res.status(200).json(new ApiResponse(200, out, "Comment updated"))
})

// Remove comment and clean up likes on that comment so DB stays tidy.
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id")
  }
  const c = await Comment.findById(commentId)
  if (!c) {
    throw new ApiError(404, "Comment not found")
  }
  if (String(c.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed to delete this comment")
  }
  // Orphan likes would break counts later, so remove them first.
  await Like.deleteMany({ comment: commentId })
  await Comment.findByIdAndDelete(commentId)
  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"))
})

export { getVideoComments, addComment, updateComment, deleteComment }
