import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { otpService } from "../services/otp.service";
import { config } from "../config";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { RoleAdmin } from "../types";

const RequestOtpSchema = z.object({
  noHp: z.string().min(9, "Nomor HP minimal 9 digit")
});

const VerifyOtpSchema = z.object({
  noHp: z.string().min(9, "Nomor HP minimal 9 digit"),
  code: z.string().length(6, "Kode OTP harus 6 digit")
});

const AdminLoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter")
});

export class AuthController {
  // 1. Minta Kode OTP (Peserta)
  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = RequestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const result = await otpService.requestOtp(parsed.data.noHp);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal meminta OTP" });
    }
  }

  // 2. Verifikasi OTP & Login (Peserta)
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = VerifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const { noHp, code } = parsed.data;
      const cleanNoHp = noHp.trim().replace(/\D/g, "");

      const isValid = await otpService.verifyOtp(cleanNoHp, code);
      if (!isValid) {
        res.status(400).json({ success: false, message: "Kode OTP salah atau sudah kedaluwarsa" });
        return;
      }

      // Cari atau buat User berdasarkan No HP
      let user = await prisma.user.findUnique({
        where: { noHp: cleanNoHp }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            noHp: cleanNoHp,
            nama: `Peserta-${cleanNoHp.slice(-4)}`
          }
        });
      }

      // Generate JWT Token untuk Peserta
      const token = jwt.sign(
        {
          userId: user.id,
          noHp: user.noHp,
          nama: user.nama,
          type: "USER"
        },
        config.jwtSecret,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          nama: user.nama,
          noHp: user.noHp,
          namaBurung: user.namaBurung
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal verifikasi OTP" });
    }
  }

  // 3. Login Admin / Superadmin
  async loginAdmin(req: Request, res: Response): Promise<void> {
    try {
      const parsed = AdminLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const { email, password } = parsed.data;
      const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!admin) {
        res.status(401).json({ success: false, message: "Email atau password salah" });
        return;
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: "Email atau password salah" });
        return;
      }

      const token = jwt.sign(
        {
          adminId: admin.id,
          email: admin.email,
          nama: admin.nama,
          role: admin.role as RoleAdmin,
          type: "ADMIN"
        },
        config.jwtSecret,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Login Admin berhasil",
        token,
        admin: {
          id: admin.id,
          nama: admin.nama,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal login admin" });
    }
  }

  // 4. Get Current Profile
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (req.user.type === "USER") {
        const user = await prisma.user.findUnique({
          where: { id: req.user.userId }
        });
        res.status(200).json({ success: true, user, type: "USER" });
        return;
      }

      if (req.user.type === "ADMIN") {
        const admin = await prisma.admin.findUnique({
          where: { id: req.user.adminId },
          select: { id: true, nama: true, email: true, role: true, createdAt: true }
        });
        res.status(200).json({ success: true, admin, type: "ADMIN" });
        return;
      }

      res.status(400).json({ success: false, message: "Tipe pengguna tidak dikenal" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data user" });
    }
  }
}

export const authController = new AuthController();
