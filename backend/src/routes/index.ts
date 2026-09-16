import { Router } from "express";
import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";
import pesertaRoutes from "./peserta.routes";
import adminRoutes from "./admin.routes";
import superadminRoutes from "./superadmin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/peserta", pesertaRoutes);
router.use("/admin", adminRoutes);
router.use("/superadmin", superadminRoutes);

export default router;
