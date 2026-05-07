// User playlists: a list of video ids + title. Owner can edit; read is public.
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"

// New empty playlist for the logged-in user.
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body
  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description are required")
  }
  const pl = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
  })
  return res.status(201).json(new ApiResponse(201, pl, "Playlist created"))
})

// All playlists owned by :userId (for a channel page).
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id")
  }
  const list = await Playlist.find({ owner: userId })
    .sort({ updatedAt: -1 })
    .lean()
  return res.status(200).json(new ApiResponse(200, list, "Playlists fetched"))
})

// One playlist with owner and video list filled in.
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id")
  }
  const pl = await Playlist.findById(playlistId)
    .populate("owner", "fullname username avatar")
    .populate("videos", "title thumbnail duration views isPublished")
    .lean()
  if (!pl) {
    throw new ApiError(404, "Playlist not found")
  }
  return res.status(200).json(new ApiResponse(200, pl, "Playlist fetched"))
})

// Push a video id if not already there; only playlist owner.
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params
  if (![playlistId, videoId].every((id) => mongoose.isValidObjectId(id))) {
    throw new ApiError(400, "Invalid ids")
  }
  if (!(await Video.exists({ _id: videoId }))) {
    throw new ApiError(404, "Video not found")
  }
  const pl = await Playlist.findById(playlistId)
  if (!pl) {
    throw new ApiError(404, "Playlist not found")
  }
  if (String(pl.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed")
  }
  const sid = String(videoId)
  // Idempotent: same video twice does not duplicate.
  if (pl.videos.map(String).includes(sid)) {
    return res
      .status(200)
      .json(new ApiResponse(200, pl, "Video already in playlist"))
  }
  pl.videos.push(videoId)
  await pl.save()
  return res.status(200).json(new ApiResponse(200, pl, "Video added to playlist"))
})

// Filter out that video id from the array; only owner.
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params
  if (![playlistId, videoId].every((id) => mongoose.isValidObjectId(id))) {
    throw new ApiError(400, "Invalid ids")
  }
  const pl = await Playlist.findById(playlistId)
  if (!pl) {
    throw new ApiError(404, "Playlist not found")
  }
  if (String(pl.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed")
  }
  pl.videos = pl.videos.filter((v) => String(v) !== String(videoId))
  await pl.save()
  return res
    .status(200)
    .json(new ApiResponse(200, pl, "Video removed from playlist"))
})

// Remove whole playlist document; only owner.
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id")
  }
  const pl = await Playlist.findById(playlistId)
  if (!pl) {
    throw new ApiError(404, "Playlist not found")
  }
  if (String(pl.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed")
  }
  await Playlist.findByIdAndDelete(playlistId)
  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted"))
})

// Change name and/or description; only owner.
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id")
  }
  const pl = await Playlist.findById(playlistId)
  if (!pl) {
    throw new ApiError(404, "Playlist not found")
  }
  if (String(pl.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed")
  }
  if (name !== undefined) pl.name = String(name).trim()
  if (description !== undefined) pl.description = String(description).trim()
  await pl.save()
  return res.status(200).json(new ApiResponse(200, pl, "Playlist updated"))
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
}
