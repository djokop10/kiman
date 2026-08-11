import { Router } from "express";
import { superadminController } from "../controllers/superadmin.controller";
import { authenticateJwt, requireSuperadmin } from "../middleware/auth.middleware";

const router = Router();

// Semua rute superadmin memerlukan otentikasi JWT & Role SUPERADMIN
router.use(authenticateJwt, requireSuperadmin);

// Event CRUD
router.get("/events", (req, res) => superadminController.getEvents(req, res));
router.post("/events", (req, res) => superadminController.createEvent(req, res));
router.put("/events/:id", (req, res) => superadminController.updateEvent(req, res));
router.delete("/events/:id", (req, res) => superadminController.deleteEvent(req, res));

// Kelas Lomba CRUD
router.get("/kelas", (req, res) => superadminController.getKelas(req, res));
router.post("/kelas", (req, res) => superadminController.createKelas(req, res));
router.put("/kelas/:id", (req, res) => superadminController.updateKelas(req, res));
router.delete("/kelas/:id", (req, res) => superadminController.deleteKelas(req, res));

// Kelola Admin
router.get("/admins", (req, res) => superadminController.getAdmins(req, res));
router.post("/admins", (req, res) => superadminController.createAdmin(req, res));
router.delete("/admins/:id", (req, res) => superadminController.deleteAdmin(req, res));

// Laporan Rekap & Finansial
router.get("/laporan", (req, res) => superadminController.getLaporan(req, res));

// Google Sheets Sync Monitor & Trigger
router.get("/sync-sheet/status", (req, res) => superadminController.getSyncStatus(req, res));
router.post("/sync-sheet/trigger", (req, res) => superadminController.triggerSyncAll(req, res));

export default router;
