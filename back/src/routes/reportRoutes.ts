import { Router } from "express"
import { ReportController } from "../controllers/reportController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const report = new ReportController()

router.get("/occupancy", requireAuth, requireRole("zaposleni"), report.occupancy)
router.get("/turnover", requireAuth, requireRole("zaposleni"), report.turnover)

export default router
