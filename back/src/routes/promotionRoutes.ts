import { Router } from "express";
import { PromotionController } from "../controllers/promotionController.js";
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const promotion = new PromotionController()

router.get("/active", promotion.getActive)
router.get("/mine", requireAuth, requireRole("zaposleni"), promotion.listForOwner)
router.post("/", requireAuth, requireRole("zaposleni"), promotion.create)
router.put("/:id", requireAuth, requireRole("zaposleni"), promotion.update)
router.delete("/:id", requireAuth, requireRole("zaposleni"), promotion.remove)

export default router