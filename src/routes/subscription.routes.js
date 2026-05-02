// /api/v1/subscriptions — GET /me/subscribers before /:channelId is not needed (different methods) but order is clear.
import { Router } from "express"
import {
  toggleSubscription,
  getSubscribedChannels,
  getMySubscribers,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)
router.get("/", getSubscribedChannels) // channels I am subscribed to
router.get("/me/subscribers", getMySubscribers) // who subscribed to me
router.post("/:channelId", toggleSubscription) // follow or unfollow that user id

export default router
