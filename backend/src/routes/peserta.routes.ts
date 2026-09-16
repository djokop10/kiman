import { Router } from "express";
import { pesertaController } from "../controllers/peserta.controller";
import { authenticateJwt, requirePeserta } from "../middleware/auth.middleware";
import { uploadBuktiTransfer } from "../middleware/upload.middleware";

const router = Router();

// Semua rute peserta memerlukan otentikasi JWT & Role USER
router.use(authenticateJwt, requirePeserta);

router.get("/pendaftaran", (req, res) => pesertaController.getMyPendaftaran(req, res));
router.get("/pendaftaran/:id", (req, res) => pesertaController.getPendaftaranDetail(req, res));
router.post(
  "/pendaftaran/:id/upload-bukti",
  uploadBuktiTransfer.single("buktiTransfer"),
  (req, res) => pesertaController.uploadBuktiTransfer(req, res)
);
router.get("/pendaftaran/:id/surat-pdf", (req, res) => pesertaController.getSuratPdf(req, res));
router.get("/notifikasi", (req, res) => pesertaController.getMyNotifikasi(req, res));

export default router;
