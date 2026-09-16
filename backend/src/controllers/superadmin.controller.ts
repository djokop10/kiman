import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { RoleAdmin, StatusEvent, StatusPendaftaran } from "../types";
import { queueService } from "../services/queue.service";

const EventSchema = z.object({
  namaEvent: z.string().min(3, "Nama event minimal 3 karakter"),
  tanggalLomba: z.string().or(z.date()),
  lokasi: z.string().min(3, "Lokasi minimal 3 karakter"),
  deskripsi: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "BUKA", "BERJALAN", "SELESAI"]).optional()
});

const KelasSchema = z.object({
  eventId: z.string().uuid("ID Event tidak valid"),
  namaKelas: z.string().min(2, "Nama kelas minimal 2 karakter"),
  harga: z.number().int().min(0, "Harga tidak boleh negatif"),
  kuota: z.number().int().min(1, "Kuota minimal 1 peserta")
});

const AdminAccountSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "SUPERADMIN"]).optional()
});

export class SuperadminController {
  // === 1. EVENT CRUD ===
  async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const events = await prisma.event.findMany({
        include: {
          kelasList: true,
          _count: {
            select: { pendaftaran: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.status(200).json({ success: true, events });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data event" });
    }
  }

  async createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = EventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const { namaEvent, tanggalLomba, lokasi, deskripsi, status } = parsed.data;
      const event = await prisma.event.create({
        data: {
          namaEvent,
          tanggalLomba: new Date(tanggalLomba),
          lokasi,
          deskripsi: deskripsi || null,
          status: status || StatusEvent.BUKA
        }
      });

      res.status(201).json({ success: true, message: "Event berhasil dibuat", event });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal membuat event" });
    }
  }

  async updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = EventSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const updateData: any = { ...parsed.data };
      if (updateData.tanggalLomba) {
        updateData.tanggalLomba = new Date(updateData.tanggalLomba);
      }

      const event = await prisma.event.update({
        where: { id },
        data: updateData
      });

      res.status(200).json({ success: true, message: "Event berhasil diperbarui", event });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengupdate event" });
    }
  }

  async deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.event.delete({ where: { id } });
      res.status(200).json({ success: true, message: "Event berhasil dihapus" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal menghapus event" });
    }
  }

  // === 2. KELAS LOMBA CRUD ===
  async getKelas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.query;
      const where: any = eventId ? { eventId: eventId as string } : {};

      const kelasList = await prisma.kelasLomba.findMany({
        where,
        include: {
          event: { select: { namaEvent: true, tanggalLomba: true } },
          _count: { select: { pendaftaran: true } }
        },
        orderBy: { harga: "asc" }
      });

      res.status(200).json({ success: true, kelasList });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data kelas" });
    }
  }

  async createKelas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = KelasSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const { eventId, namaKelas, harga, kuota } = parsed.data;
      const kelas = await prisma.kelasLomba.create({
        data: {
          eventId,
          namaKelas,
          harga,
          kuota
        },
        include: { event: true }
      });

      res.status(201).json({ success: true, message: "Kelas lomba berhasil ditambahkan", kelas });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal membuat kelas lomba" });
    }
  }

  async updateKelas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = KelasSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const kelas = await prisma.kelasLomba.update({
        where: { id },
        data: parsed.data
      });

      res.status(200).json({ success: true, message: "Kelas lomba berhasil diperbarui", kelas });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengupdate kelas lomba" });
    }
  }

  async deleteKelas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.kelasLomba.delete({ where: { id } });
      res.status(200).json({ success: true, message: "Kelas lomba berhasil dihapus" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal menghapus kelas lomba" });
    }
  }

  // === 3. KELOLA AKUN ADMIN ===
  async getAdmins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { auditLogs: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      res.status(200).json({ success: true, admins });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data admin" });
    }
  }

  async createAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = AdminAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const { nama, email, password, role } = parsed.data;
      const cleanEmail = email.toLowerCase().trim();

      const existing = await prisma.admin.findUnique({
        where: { email: cleanEmail }
      });

      if (existing) {
        res.status(400).json({ success: false, message: "Email admin sudah digunakan" });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const admin = await prisma.admin.create({
        data: {
          nama,
          email: cleanEmail,
          passwordHash,
          role: role || RoleAdmin.ADMIN
        },
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      res.status(201).json({ success: true, message: "Akun admin berhasil dibuat", admin });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal membuat akun admin" });
    }
  }

  async deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Jangan hapus akun sendiri jika sedang login
      if (req.user && req.user.type === "ADMIN" && req.user.adminId === id) {
        res.status(400).json({ success: false, message: "Tidak dapat menghapus akun Anda sendiri" });
        return;
      }

      await prisma.admin.delete({ where: { id } });
      res.status(200).json({ success: true, message: "Akun admin berhasil dihapus" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal menghapus admin" });
    }
  }

  // === 4. LAPORAN REKAP PENDAFTAR & FINANSIAL ===
  async getLaporan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.query;

      const events = await prisma.event.findMany({
        where: eventId ? { id: eventId as string } : {},
        include: {
          kelasList: {
            include: {
              pendaftaran: {
                select: {
                  id: true,
                  status: true,
                  nomorUrut: true
                }
              }
            }
          }
        }
      });

      let totalPendapatanGlobal = 0;
      let totalPendaftarGlobal = 0;
      let totalPesertaLunasGlobal = 0;

      const laporanEvent = events.map((ev) => {
        let eventTotalPendaftar = 0;
        let eventTotalLunas = 0;
        let eventPendapatan = 0;

        const rekapKelas = ev.kelasList.map((k) => {
          const totalPendaftarKelas = k.pendaftaran.length;
          const lunasCount = k.pendaftaran.filter((p) => p.status === StatusPendaftaran.LUNAS_TERDAFTAR_RESMI).length;
          const menungguSeleksiCount = k.pendaftaran.filter((p) => p.status === StatusPendaftaran.MENUNGGU_SELEKSI).length;
          const menungguBayarCount = k.pendaftaran.filter((p) => p.status === StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN).length;
          const menungguVerifCount = k.pendaftaran.filter((p) => p.status === StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN).length;
          const ditolakCount = k.pendaftaran.filter((p) => p.status === StatusPendaftaran.DITOLAK_UPLOAD_ULANG).length;
          const tidakLolosCount = k.pendaftaran.filter((p) => p.status === StatusPendaftaran.TIDAK_LOLOS).length;
          const subtotalPendapatan = lunasCount * k.harga;

          eventTotalPendaftar += totalPendaftarKelas;
          eventTotalLunas += lunasCount;
          eventPendapatan += subtotalPendapatan;

          return {
            kelasId: k.id,
            namaKelas: k.namaKelas,
            harga: k.harga,
            kuota: k.kuota,
            terisi: lunasCount,
            sisaKuota: Math.max(0, k.kuota - lunasCount),
            persentaseTerisi: Math.round((lunasCount / (k.kuota || 1)) * 100),
            totalPendaftar: totalPendaftarKelas,
            menungguSeleksi: menungguSeleksiCount,
            menungguBayar: menungguBayarCount,
            menungguVerifikasi: menungguVerifCount,
            ditolakUploadUlang: ditolakCount,
            tidakLolos: tidakLolosCount,
            lunas: lunasCount,
            pendapatan: subtotalPendapatan
          };
        });

        totalPendapatanGlobal += eventPendapatan;
        totalPendaftarGlobal += eventTotalPendaftar;
        totalPesertaLunasGlobal += eventTotalLunas;

        return {
          eventId: ev.id,
          namaEvent: ev.namaEvent,
          tanggalLomba: ev.tanggalLomba,
          lokasi: ev.lokasi,
          status: ev.status,
          totalPendaftar: eventTotalPendaftar,
          totalLunas: eventTotalLunas,
          pendapatan: eventPendapatan,
          rekapKelas
        };
      });

      res.status(200).json({
        success: true,
        summary: {
          totalPendapatan: totalPendapatanGlobal,
          totalPendaftar: totalPendaftarGlobal,
          totalPesertaLunas: totalPesertaLunasGlobal,
          totalEvent: events.length
        },
        laporanEvent
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal membuat laporan" });
    }
  }

  // === 5. GOOGLE SHEET SYNC STATUS & TRIGGER ===
  async getSyncStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await queueService.getSyncStats();
      res.status(200).json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil status sync" });
    }
  }

  async triggerSyncAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Ambil semua pendaftaran dan masukkan ke antrean sync
      const allPendaftaran = await prisma.pendaftaran.findMany({
        select: { id: true }
      });

      for (const p of allPendaftaran) {
        await queueService.enqueueSync(p.id);
      }

      res.status(200).json({
        success: true,
        message: `Sinkronisasi massal untuk ${allPendaftaran.length} data pendaftaran telah dijadwalkan ke antrean background.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal menjadwalkan sync massal" });
    }
  }
}

export const superadminController = new SuperadminController();
