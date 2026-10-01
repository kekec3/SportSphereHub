import { Router } from "express";
import { ReservationController } from "../controllers/reservationController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router()
const reservation = new ReservationController()

router.get("/mine", requireAuth, reservation.getMine)
router.get("/owner", requireAuth, requireRole("zaposleni"), reservation.listForOwner)
router.put("/:id/cancel", requireAuth, reservation.cancel)
router.put("/:id/confirm", requireAuth, requireRole("zaposleni"), reservation.confirm)
router.put("/:id/no-show", requireAuth, requireRole("zaposleni"), reservation.noShow)
router.put("/:id/move", requireAuth, requireRole("zaposleni"), reservation.move)
router.post("/", requireAuth, reservation.create)

export default router