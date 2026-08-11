import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateJwt } from "../middleware/auth.middleware";

const router = Router();

// Endpoint publik
router.post("/otp/request", (req, res) => authController.requestOtp(req, res));
router.post("/otp/verify", (req, res) => authController.verifyOtp(req, res));
router.post("/admin/login", (req, res) => authController.loginAdmin(req, res));

// Endpoint terproteksi
router.get("/me", authenticateJwt, (req, res) => authController.getMe(req, res));

export default router;
