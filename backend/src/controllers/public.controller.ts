import { Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { StatusPendaftaran, StatusEvent, JenisNotifikasi } from "../types";
import { queueService } from "../services/queue.service";

const PendaftaranPublicSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  noHp: z.string().min(9, "Nomor HP minimal 9 digit"),
  namaBurung: z.string().optional().nullable(),
  eventId: z.string().uuid("ID Event tidak valid"),
  kelasLombaId: z.string().uuid("ID Kelas Lomba tidak valid")
});

export class PublicController {
  // 1. Ambil Event Aktif beserta Kelas Lomba & Harga
  async getActiveEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: { in: [StatusEvent.BUKA, StatusEvent.BERJALAN] }
        },
        include: {
          kelasList: {
            orderBy: { harga: "asc" }
          },
          _count: {
            select: { pendaftaran: true }
          }
        },
        orderBy: { tanggalLomba: "asc" }
      });

      res.status(200).json({ success: true, events });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data event" });
    }
  }

  // 2. Submit Form Pendaftaran Publik (Auto-create user jika belum ada)
  async submitPendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const parsed = PendaftaranPublicSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const { nama, noHp, namaBurung, eventId, kelasLombaId } = parsed.data;
      const cleanNoHp = noHp.trim().replace(/\D/g, "");

      // Validasi Event & Kelas Lomba
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        res.status(404).json({ success: false, message: "Event tidak ditemukan" });
        return;
      }

      const kelas = await prisma.kelasLomba.findFirst({
        where: {
          id: kelasLombaId,
          eventId
        }
      });

      if (!kelas) {
        res.status(404).json({ success: false, message: "Kelas lomba tidak ditemukan untuk event ini" });
        return;
      }

      // Auto-Create atau Update User berbasis No HP
      let user = await prisma.user.findUnique({
        where: { noHp: cleanNoHp }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            nama: nama.trim(),
            noHp: cleanNoHp,
            namaBurung: namaBurung ? namaBurung.trim() : null
          }
        });
      } else {
        // Update nama atau burung jika ada perubahan
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            nama: nama.trim(),
            namaBurung: namaBurung ? namaBurung.trim() : user.namaBurung
          }
        });
      }

      // Cek apakah user sudah terdaftar di kelas lomba yang sama pada event ini
      const existingPendaftaran = await prisma.pendaftaran.findFirst({
        where: {
          userId: user.id,
          kelasLombaId,
          status: { notIn: [StatusPendaftaran.TIDAK_LOLOS] }
        }
      });

      if (existingPendaftaran) {
        res.status(400).json({
          success: false,
          message: "Anda sudah memiliki pendaftaran aktif untuk kelas lomba ini",
          pendaftaranId: existingPendaftaran.id
        });
        return;
      }

      // Generate Nomor Registrasi Unik (Format: KM-YYYYMMDD-XXXX)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const nomorRegistrasi = `KM-${dateStr}-${randomSuffix}`;

      // Buat Pendaftaran Baru
      const pendaftaran = await prisma.pendaftaran.create({
        data: {
          userId: user.id,
          eventId,
          kelasLombaId,
          nomorRegistrasi,
          status: StatusPendaftaran.MENUNGGU_SELEKSI
        },
        include: {
          event: true,
          kelasLomba: true,
          user: true
        }
      });

      // Buat notifikasi pertama untuk user
      await prisma.notifikasi.create({
        data: {
          userId: user.id,
          pendaftaranId: pendaftaran.id,
          pesan: `Pendaftaran Anda untuk event "${event.namaEvent}" (${kelas.namaKelas}) berhasil diterima. Menunggu proses seleksi oleh panitia.`,
          jenis: JenisNotifikasi.AUTO
        }
      });

      // Enqueue sync ke Google Sheets
      queueService.enqueueSync(pendaftaran.id);

      // Buat token login instan untuk peserta
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

      res.status(201).json({
        success: true,
        message: "Pendaftaran berhasil dikirim! Silakan pantau status seleksi di dashboard.",
        token,
        pendaftaran: {
          id: pendaftaran.id,
          nomorRegistrasi: pendaftaran.nomorRegistrasi,
          status: pendaftaran.status,
          event: pendaftaran.event.namaEvent,
          kelas: pendaftaran.kelasLomba.namaKelas,
          harga: pendaftaran.kelasLomba.harga
        },
        user: {
          id: user.id,
          nama: user.nama,
          noHp: user.noHp
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal memproses pendaftaran" });
    }
  }
}

export const publicController = new PublicController();
