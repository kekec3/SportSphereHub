import { Router } from "express"
import { ObjectController } from "../controllers/objectController.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
const object = new ObjectController()

router.get("/", object.listApproved)
router.get("/stats", object.stats)
router.get("/cities", object.listCities)
router.get("/search", object.searchObjects)
router.get("/pending", requireAuth, requireRole("admin"), object.listPending)
router.get("/mine", requireAuth, requireRole("zaposleni"), object.myObjects)
router.get("/mine/:id", requireAuth, requireRole("zaposleni"), object.getOwned)
router.post("/", requireAuth, requireRole("zaposleni"), object.createObject)
router.post("/import", requireAuth, requireRole("zaposleni"), object.importObject)
router.put("/:id", requireAuth, requireRole("zaposleni"), object.updateObject)
router.post("/:id/resources", requireAuth, requireRole("zaposleni"), object.addResource)
router.put("/:id/resources/:rid", requireAuth, requireRole("zaposleni"), object.updateResource)
router.delete("/:id/resources/:rid", requireAuth, requireRole("zaposleni"), object.deleteResource)
router.put("/:id/approve", requireAuth, requireRole("admin"), object.approveObject)
router.delete("/:id", requireAuth, requireRole("admin"), object.rejectObject)

router.get("/:id", object.getById)

export default router