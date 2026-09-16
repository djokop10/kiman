import { Router } from "express";
import { publicController } from "../controllers/public.controller";

const router = Router();

router.get("/events/active", (req, res) => publicController.getActiveEvents(req, res));
router.post("/pendaftaran", (req, res) => publicController.submitPendaftaran(req, res));

export default router;
