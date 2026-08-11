import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticateJwt, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Semua rute admin memerlukan otentikasi JWT & Role ADMIN / SUPERADMIN
router.use(authenticateJwt, requireAdmin);

router.get("/pendaftaran", (req, res) => adminController.getPendaftaranList(req, res));
router.get("/pendaftaran/:id", (req, res) => adminController.getPendaftaranDetail(req, res));
router.post("/pendaftaran/:id/seleksi", (req, res) => adminController.seleksiPeserta(req, res));
router.post("/pendaftaran/:id/verifikasi", (req, res) => adminController.verifikasiPembayaran(req, res));
router.get("/stats", (req, res) => adminController.getStats(req, res));

export default router;
