import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"

const getAllVideos = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const channelUsername = String(
        req.query.channelUsername ?? req.query.channel ?? "",
    )
        .trim()
        .toLowerCase()

    let match
    if (channelUsername) {
        const owner = await User.findOne({ username: channelUsername }).select("_id").lean()
        if (!owner) {
            throw new ApiError(404, "Channel not found")
        }
        const ownerOid = new mongoose.Types.ObjectId(String(owner._id))
        match = {
            owner: ownerOid,
            $nor: [{ isPublished: false }],
        }
    } else {
        match = { isPublished: true }
    }

    const aggregate = Video.aggregate([
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { fullname: 1, username: 1, avatar: 1 } },
                ],
            },
        },
        { $addFields: { owner: { $first: "$owner" } } },
        { $sort: { createdAt: -1 } },
    ])
    const result = await Video.aggregatePaginate(aggregate, { page, limit })
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const found = await Video.findById(videoId).lean()
    if (!found) {
        throw new ApiError(404, "Video not found")
    }
    const isOwner = req.user && String(found.owner) === String(req.user._id)
    if (!found.isPublished && !isOwner) {
        throw new ApiError(404, "Video not found")
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    )
        .populate("owner", "fullname username avatar")
        .lean()
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched"))
})

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description, duration, isPublished } = req.body
    if ([title, description, duration].some((f) => f === undefined || f === null || String(f).trim() === "")) {
        throw new ApiError(400, "title, description, and duration are required")
    }
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Failed to upload video or thumbnail")
    }
    const durationNum = Number(duration)
    if (!Number.isFinite(durationNum) || durationNum < 0) {
        throw new ApiError(400, "Invalid duration (seconds)")
    }
    const created = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: durationNum,
        isPublished: isPublished === "false" || isPublished === false ? false : true,
        owner: req.user._id,
    })
    const populated = await Video.findById(created._id)
        .populate("owner", "fullname username avatar")
        .lean()
    return res
        .status(201)
        .json(new ApiResponse(201, populated, "Video published"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const { title, description, isPublished } = req.body
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403, "Not allowed to update this video")
    }
    if (title !== undefined) video.title = String(title).trim()
    if (description !== undefined) video.description = String(description).trim()
    if (isPublished !== undefined) {
        video.isPublished = isPublished === "false" || isPublished === false ? false : true
    }
    await video.save()
    const out = await Video.findById(videoId)
        .populate("owner", "fullname username avatar")
        .lean()
    return res
        .status(200)
        .json(new ApiResponse(200, out, "Video updated"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403, "Not allowed to delete this video")
    }
    await deleteFromCloudinary(video.videoFile, { resourceType: "video" })
    await deleteFromCloudinary(video.thumbnail, { resourceType: "image" })
    await Video.findByIdAndDelete(videoId)
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted"))
})

const getMyVideos = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const aggregate = Video.aggregate([
        { $match: { owner: req.user._id } },
        { $sort: { createdAt: -1 } },
    ])
    const result = await Video.aggregatePaginate(aggregate, { page, limit })
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Your videos"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403, "Not allowed to change publish status")
    }
    video.isPublished = !video.isPublished
    await video.save()
    const out = await Video.findById(videoId)
        .populate("owner", "fullname username avatar")
        .lean()
    return res
        .status(200)
        .json(new ApiResponse(200, out, "Publish status updated"))
})

export {
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    getMyVideos,
    togglePublishStatus,
}
