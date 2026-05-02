// Logged-in creator: quick counts for a home / studio dashboard.
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Comment } from "../models/comment.model.js"

const getDashboardStats = asyncHandler(async (req, res) => {
  const id = req.user._id
  // Run counts in parallel to answer faster.
  const [totalVideos, totalSubscribers, totalSubscribed, myVideos] = await Promise.all([
    Video.countDocuments({ owner: id }),
    Subscription.countDocuments({ channel: id }),
    Subscription.countDocuments({ subscriber: id }),
    // Need video ids to count comments only on this user's videos.
    Video.find({ owner: id }).select("_id").lean(),
  ])
  // Comments on any video owned by me.
  const totalCommentsOnChannel = myVideos.length
    ? await Comment.countDocuments({ video: { $in: myVideos.map((v) => v._id) } })
    : 0
  return res.status(200).json(
    new ApiResponse(
      200,
      { totalVideos, totalSubscribers, totalSubscribed, totalCommentsOnChannel },
      "Dashboard stats"
    )
  )
})

export { getDashboardStats }
