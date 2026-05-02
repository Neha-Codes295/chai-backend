import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"

// export const verifyJWT = asyncHandler(async (req, res, next) => {
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        // Stable id for downstream handlers (some clients lose doc shape; avoids findById(null))
        req.userId = user._id;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})

/** Call next() without user when there is no / invalid token (read-only / public + owner routes). */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            return next()
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (user) {
            req.user = user
            req.userId = user._id
        }
    } catch {
        // unauthenticated: continue as guest
    }
    next()
})