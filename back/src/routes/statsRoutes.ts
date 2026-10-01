import { Router } from "express"
import { StatsController } from "../controllers/statsController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const stats = new StatsController()

router.get("/dashboard", requireAuth, requireRole("sportista"), stats.dashboard)

export default router
