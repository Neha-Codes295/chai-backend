// /api/v1/healthcheck — one GET for uptime checks (load balancers, etc.).
import { Router } from "express"
import { healthcheck } from "../controllers/healthcheck.controller.js"

const router = Router()
router.get("/", healthcheck)
export default router
