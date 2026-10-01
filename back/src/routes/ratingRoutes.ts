import { Router } from "express"
import { RatingController } from "../controllers/ratingController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"
import { optionalAuth } from "../middleware/requireAuth.js"

const router = Router()
const rating = new RatingController()

router.get("/object/:objectId", optionalAuth, rating.getForObject)
router.post("/", requireAuth, requireRole("sportista"), rating.create)

export default router
