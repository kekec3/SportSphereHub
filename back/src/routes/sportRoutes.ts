import { Router } from "express";
import { SportController } from "../controllers/sportController.js";
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const sport = new SportController();

router.get("/", sport.list)
router.post("/", requireAuth, requireRole("admin"), sport.create)

export default router