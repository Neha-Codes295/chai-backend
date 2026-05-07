// Short posts (like Twitter). CRUD for own tweets; list is public by user id.
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Tweet } from "../models/tweet.model.js"
import { Like } from "../models/like.model.js"

// New tweet for current user.
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }
  const t = await Tweet.create({ content: content.trim(), owner: req.user._id })
  return res.status(201).json(new ApiResponse(201, t, "Tweet created"))
})

// Paginated tweets for :userId (for profile / feed by user).
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id")
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  const [total, list] = await Promise.all([
    Tweet.countDocuments({ owner: userId }),
    Tweet.find({ owner: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ])
  return res
    .status(200)
    .json(new ApiResponse(200, { data: list, page, limit, total }, "Tweets fetched"))
})

// Only tweet owner can edit.
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const { content } = req.body
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id")
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }
  const t = await Tweet.findById(tweetId)
  if (!t) {
    throw new ApiError(404, "Tweet not found")
  }
  if (String(t.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed")
  }
  t.content = content.trim()
  await t.save()
  return res.status(200).json(new ApiResponse(200, t, "Tweet updated"))
})

// Delete tweet and its likes so data stays clean.
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id")
  }
  const t = await Tweet.findById(tweetId)
  if (!t) {
    throw new ApiError(404, "Tweet not found")
  }
  if (String(t.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed")
  }
  await Like.deleteMany({ tweet: tweetId })
  await Tweet.findByIdAndDelete(tweetId)
  return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted"))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
