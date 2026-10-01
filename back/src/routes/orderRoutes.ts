import { Router } from "express"
import { OrderController } from "../controllers/orderControler.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const order = new OrderController()

router.get("/mine", requireAuth, requireRole("sportista"), order.mine)
router.post("/", requireAuth, requireRole("sportista"), order.create)
router.get("/owner", requireAuth, requireRole("zaposleni"), order.ownerOrders)
router.put("/:id/pickup", requireAuth, requireRole("zaposleni"), order.pickup)
router.put("/:id/decline", requireAuth, requireRole("zaposleni"), order.decline)
router.put("/:id/cancel", requireAuth, requireRole("sportista"), order.cancel)

export default router
