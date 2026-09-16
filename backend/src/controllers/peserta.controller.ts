import { Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusPendaftaran, JenisNotifikasi } from "../types";
import { queueService } from "../services/queue.service";
import { config } from "../config";

export class PesertaController {
  // 1. Ambil Semua Riwayat Pendaftaran Milik Peserta
  async getMyPendaftaran(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.type !== "USER") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const pendaftaranList = await prisma.pendaftaran.findMany({
        where: { userId: req.user.userId },
        include: {
          event: true,
          kelasLomba: true,
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 3
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.status(200).json({ success: true, pendaftaranList });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data pendaftaran" });
    }
  }

  // 2. Detail Pendaftaran
  async getPendaftaranDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.type !== "USER") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const pendaftaran = await prisma.pendaftaran.findFirst({
        where: {
          id,
          userId: req.user.userId
        },
        include: {
          event: true,
          kelasLomba: true,
          notifikasi: {
            orderBy: { createdAt: "desc" }
          },
          auditLogs: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!pendaftaran) {
        res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan" });
        return;
      }

      res.status(200).json({ success: true, pendaftaran });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil detail pendaftaran" });
    }
  }

  // 3. Upload Bukti Transfer Manual
  async uploadBuktiTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.type !== "USER") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, message: "File bukti transfer wajib diunggah" });
        return;
      }

      const pendaftaran = await prisma.pendaftaran.findFirst({
        where: {
          id,
          userId: req.user.userId
        },
        include: {
          event: true,
          kelasLomba: true
        }
      });

      if (!pendaftaran) {
        res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan" });
        return;
      }

      // Validasi State Machine: Hanya boleh upload jika status LOLOS_MENUNGGU_PEMBAYARAN atau DITOLAK_UPLOAD_ULANG
      const allowedStatuses: string[] = [
        StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN,
        StatusPendaftaran.DITOLAK_UPLOAD_ULANG
      ];

      if (!allowedStatuses.includes(pendaftaran.status)) {
        res.status(400).json({
          success: false,
          message: `Tidak dapat mengunggah bukti transfer saat status adalah "${pendaftaran.status}". Anda harus lolos seleksi terlebih dahulu.`
        });
        return;
      }

      // Path relatif file untuk disimpan ke database
      const relativePath = `/storage/bukti-transfer/${pendaftaran.id}/${file.filename}`;

      // Update Pendaftaran ke MENUNGGU_VERIFIKASI_PEMBAYARAN
      const updatedPendaftaran = await prisma.pendaftaran.update({
        where: { id: pendaftaran.id },
        data: {
          buktiTransferUrl: relativePath,
          status: StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN,
          catatanPenolakan: null // Bersihkan catatan tolak sebelumnya
        },
        include: {
          event: true,
          kelasLomba: true
        }
      });

      // Buat Notifikasi untuk Peserta
      await prisma.notifikasi.create({
        data: {
          userId: req.user.userId,
          pendaftaranId: pendaftaran.id,
          pesan: `Bukti transfer untuk kelas ${pendaftaran.kelasLomba.namaKelas} berhasil diunggah. Menunggu verifikasi oleh admin.`,
          jenis: JenisNotifikasi.AUTO
        }
      });

      // Enqueue sync Google Sheets
      queueService.enqueueSync(pendaftaran.id);

      res.status(200).json({
        success: true,
        message: "Bukti transfer berhasil diunggah dan sedang menunggu verifikasi panitia.",
        pendaftaran: updatedPendaftaran
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengunggah bukti transfer" });
    }
  }

  // 4. Download Surat PDF
  async getSuratPdf(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.type !== "USER") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const pendaftaran = await prisma.pendaftaran.findFirst({
        where: {
          id,
          userId: req.user.userId
        }
      });

      if (!pendaftaran) {
        res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan" });
        return;
      }

      if (pendaftaran.status !== StatusPendaftaran.LUNAS_TERDAFTAR_RESMI || !pendaftaran.suratUrl) {
        res.status(400).json({
          success: false,
          message: "Surat tiket belum diterbitkan karena pembayaran belum diverifikasi / lunas."
        });
        return;
      }

      // Ambil file fisik
      const localFilePath = path.join(process.cwd(), pendaftaran.suratUrl);
      if (!fs.existsSync(localFilePath)) {
        res.status(404).json({ success: false, message: "File PDF tidak ditemukan di server" });
        return;
      }

      res.download(localFilePath, `Tiket-${pendaftaran.nomorRegistrasi}.pdf`);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengunduh surat PDF" });
    }
  }

  // 5. Riwayat Notifikasi Peserta
  async getMyNotifikasi(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.type !== "USER") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const notifikasi = await prisma.notifikasi.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        include: {
          pendaftaran: {
            select: {
              nomorRegistrasi: true,
              status: true
            }
          }
        }
      });

      // Tandai dibaca
      await prisma.notifikasi.updateMany({
        where: { userId: req.user.userId, dibaca: false },
        data: { dibaca: true }
      });

      res.status(200).json({ success: true, notifikasi });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil notifikasi" });
    }
  }
}

export const pesertaController = new PesertaController();
