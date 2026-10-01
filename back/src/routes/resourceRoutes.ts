import { Router } from "express";
import { ReservationController } from "../controllers/reservationController.js";
import { requireAuth } from "../middleware/requireAuth.js"

const router = Router()
const reservation = new ReservationController()

router.get("/:id/calendar", requireAuth, reservation.getCalendar)

export default router