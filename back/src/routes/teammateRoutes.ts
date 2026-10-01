import { Router } from "express"
import { TeammateController } from "../controllers/teammateController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const teammate = new TeammateController()

router.get("/mine", requireAuth, requireRole("sportista"), teammate.mine)
router.get("/", requireAuth, requireRole("sportista"), teammate.listActive)
router.post("/", requireAuth, requireRole("sportista"), teammate.create)
router.put("/requests/:id", requireAuth, requireRole("sportista"), teammate.respond)
router.post("/:id/join", requireAuth, requireRole("sportista"), teammate.join)
router.put("/:id/close", requireAuth, requireRole("sportista"), teammate.close)

export default router
