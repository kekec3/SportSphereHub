import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router()
const auth = new AuthController()

// public
router.post("/register", auth.register)
router.post("/login", auth.login)
router.post("/forgot-password", auth.forgotPassword)
router.post("/reset-password/:token", auth.resetPassword)

// admin-only registration review
router.get("/registration-requests", requireAuth, requireRole("admin"), auth.registrationRequests)
router.post("/registration-requests/:id/approve", requireAuth, requireRole("admin"), auth.approveRegistration)
router.post("/registration-requests/:id/reject", requireAuth, requireRole("admin"), auth.rejectRegistration)

export default router
