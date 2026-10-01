import { Router } from "express"
import { TrainingController } from "../controllers/trainingController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const training = new TrainingController()

router.get("/mine", requireAuth, requireRole("sportista"), training.mine)
router.get("/owner", requireAuth, requireRole("zaposleni"), training.listForOwner)
router.post("/", requireAuth, requireRole("sportista"), training.create)
router.put("/:id/cancel", requireAuth, requireRole("sportista"), training.cancel)

export default router
