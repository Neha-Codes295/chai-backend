// Simple ping for monitoring: checks that the API process is up (no DB call).
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const healthcheck = asyncHandler(async (_req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: "ok" }, "Server is healthy"))
})

export { healthcheck }
