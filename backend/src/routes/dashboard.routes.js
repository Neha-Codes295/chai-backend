// /api/v1/dashboard/stats — creator numbers for the logged-in user.
import { Router } from "express"
import { getDashboardStats } from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.get("/stats", verifyJWT, getDashboardStats)
export default router
