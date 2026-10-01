import { Router } from "express"
import { EquipmentController } from "../controllers/equipmentController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const equipment = new EquipmentController()

router.get("/mine", requireAuth, requireRole("zaposleni"), equipment.listForOwner)
router.get("/", requireAuth, requireRole("sportista"), equipment.list)
router.post("/", requireAuth, requireRole("zaposleni"), equipment.create)
router.put("/:id", requireAuth, requireRole("zaposleni"), equipment.update)
router.delete("/:id", requireAuth, requireRole("zaposleni"), equipment.remove)

export default router
