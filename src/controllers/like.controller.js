// Likes: one row per (user + target). Toggle = delete row or create row.
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

// If this user already liked the video, remove like; else add like.
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }
  if (!(await Video.exists({ _id: videoId }))) {
    throw new ApiError(404, "Video not found")
  }
  const existing = await Like.findOne({ video: videoId, likedBy: req.user._id })
  if (existing) {
    await Like.findByIdAndDelete(existing._id)
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Video unliked"))
  }
  await Like.create({ video: videoId, likedBy: req.user._id })
  return res.status(200).json(new ApiResponse(200, { liked: true }, "Video liked"))
})

// Same idea as video: one like doc with comment + likedBy, or remove it.
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id")
  }
  if (!(await Comment.exists({ _id: commentId }))) {
    throw new ApiError(404, "Comment not found")
  }
  const existing = await Like.findOne({ comment: commentId, likedBy: req.user._id })
  if (existing) {
    await Like.findByIdAndDelete(existing._id)
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Comment unliked"))
  }
  await Like.create({ comment: commentId, likedBy: req.user._id })
  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Comment liked"))
})

// Like or unlike a tweet for the current user.
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id")
  }
  if (!(await Tweet.exists({ _id: tweetId }))) {
    throw new ApiError(404, "Tweet not found")
  }
  const existing = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })
  if (existing) {
    await Like.findByIdAndDelete(existing._id)
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Tweet unliked"))
  }
  await Like.create({ tweet: tweetId, likedBy: req.user._id })
  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Tweet liked"))
})

// List videos this user liked (paged), order same as when they liked (newest like first).
const getLikedVideos = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  // Only rows that are for a video, not comment/tweet likes.
  const filter = { likedBy: req.user._id, video: { $exists: true, $ne: null } }
  const [total, likePage] = await Promise.all([
    Like.countDocuments(filter),
    Like.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("video")
      .lean(),
  ])
  const videoIds = likePage.map((l) => l.video).filter(Boolean)
  const vdocs = await Video.find({ _id: { $in: videoIds } })
    .populate("owner", "fullname username avatar")
    .lean()
  // Map keeps order of videoIds (like order) after the find.
  const byId = new Map(vdocs.map((v) => [String(v._id), v]))
  const data = videoIds
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data, page, limit, total },
        "Liked videos fetched"
      )
    )
})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos }
