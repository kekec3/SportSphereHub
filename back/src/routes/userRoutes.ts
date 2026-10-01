import { Router } from "express"
import { UserController } from "../controllers/userController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const user = new UserController()

router.get("/me", requireAuth, user.getMe)
router.put("/me", requireAuth, user.updateMe)
router.get("/", requireAuth, requireRole("admin"), user.adminList)
router.put("/:id", requireAuth, requireRole("admin"), user.adminUpdate)
router.delete("/:id", requireAuth, requireRole("admin"), user.adminDelete)

export default router
