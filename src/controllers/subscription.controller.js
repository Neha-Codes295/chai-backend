// Follow a channel (user id). One subscription row = viewer follows that channel.
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"

// If already subscribed, delete row (unfollow). Else create row (follow).
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id")
  }
  // No self-follow: channel id and logged-in user must differ.
  if (String(channelId) === String(req.user._id)) {
    throw new ApiError(400, "You cannot subscribe to your own channel")
  }
  if (!(await User.exists({ _id: channelId }))) {
    throw new ApiError(404, "Channel not found")
  }
  const existing = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  })
  if (existing) {
    await Subscription.findByIdAndDelete(existing._id)
    return res
      .status(200)
      .json(new ApiResponse(200, { subscribed: false }, "Unsubscribed"))
  }
  await Subscription.create({ subscriber: req.user._id, channel: channelId })
  return res
    .status(200)
    .json(new ApiResponse(200, { subscribed: true }, "Subscribed"))
})

// Who do I follow? (subscriber = me, populate channel user profile).
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ subscriber: req.user._id })
    .populate("channel", "fullname username avatar")
    .lean()
  return res
    .status(200)
    .json(
      new ApiResponse(200, subs, "Subscribed channels fetched")
    )
})

// Who follows my channel? (channel = me, list subscribers).
const getMySubscribers = asyncHandler(async (req, res) => {
  const list = await Subscription.find({ channel: req.user._id })
    .populate("subscriber", "fullname username avatar")
    .lean()
  return res
    .status(200)
    .json(
      new ApiResponse(200, list, "Subscribers fetched")
    )
})

export { toggleSubscription, getSubscribedChannels, getMySubscribers }
