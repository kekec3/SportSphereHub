import { Router } from "express"
import { CoachController } from "../controllers/coachController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const coach = new CoachController()

router.get("/", requireAuth, requireRole("sportista"), coach.list)
router.get("/all", requireAuth, requireRole("admin"), coach.adminList)
router.post("/", requireAuth, requireRole("admin"), coach.create)
router.put("/:id/toggle", requireAuth, requireRole("admin"), coach.toggleActive)

export default router
