import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusPendaftaran, JenisNotifikasi } from "../types";
import { auditService } from "../services/audit.service";
import { pdfService } from "../services/pdf.service";
import { queueService } from "../services/queue.service";

const SeleksiSchema = z.object({
  status: z.enum(["LOLOS", "TIDAK_LOLOS"]),
  catatan: z.string().optional()
});

const VerifikasiSchema = z.object({
  status: z.enum(["APPROVE", "REJECT"]),
  catatan: z.string().optional()
});

export class AdminController {
  // 1. Ambil Daftar Pendaftaran Peserta (Filter by event, kelas, status, keyword)
  async getPendaftaranList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId, kelasLombaId, status, search, page = "1", limit = "50" } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      const whereClause: any = {};

      if (eventId) whereClause.eventId = eventId as string;
      if (kelasLombaId) whereClause.kelasLombaId = kelasLombaId as string;
      if (status) whereClause.status = status as string;

      if (search) {
        const searchStr = (search as string).trim();
        whereClause.OR = [
          { nomorRegistrasi: { contains: searchStr } },
          { user: { nama: { contains: searchStr } } },
          { user: { noHp: { contains: searchStr } } },
          { user: { namaBurung: { contains: searchStr } } }
        ];
      }

      const [total, pendaftaranList] = await Promise.all([
        prisma.pendaftaran.count({ where: whereClause }),
        prisma.pendaftaran.findMany({
          where: whereClause,
          include: {
            user: true,
            event: true,
            kelasLomba: true
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum
        })
      ]);

      res.status(200).json({
        success: true,
        data: pendaftaranList,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil data pendaftaran" });
    }
  }

  // 2. Detail Pendaftaran & Riwayat Audit Log
  async getPendaftaranDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pendaftaran = await prisma.pendaftaran.findUnique({
        where: { id },
        include: {
          user: true,
          event: true,
          kelasLomba: true,
          auditLogs: {
            include: {
              admin: {
                select: { id: true, nama: true, email: true, role: true }
              }
            },
            orderBy: { createdAt: "asc" }
          },
          notifikasi: {
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

  // 3. Aksi Seleksi: Menandai Lolos atau Tidak Lolos
  async seleksiPeserta(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.type === "ADMIN" ? req.user.adminId : undefined;

      const parsed = SeleksiSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const pendaftaran = await prisma.pendaftaran.findUnique({
        where: { id },
        include: { user: true, event: true, kelasLomba: true }
      });

      if (!pendaftaran) {
        res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan" });
        return;
      }

      // State machine validation: Hanya boleh diseleksi dari status MENUNGGU_SELEKSI
      if (pendaftaran.status !== StatusPendaftaran.MENUNGGU_SELEKSI) {
        res.status(400).json({
          success: false,
          message: `Status saat ini "${pendaftaran.status}" tidak dapat diseleksi ulang.`
        });
        return;
      }

      const statusSebelumnya = pendaftaran.status as StatusPendaftaran;
      let statusSesudahnya: StatusPendaftaran;
      let pesanNotif: string;

      if (parsed.data.status === "LOLOS") {
        statusSesudahnya = StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN;
        pesanNotif = "Anda sudah terpilih untuk mengikuti lomba, silakan lakukan pembayaran dan upload bukti transfer.";
      } else {
        statusSesudahnya = StatusPendaftaran.TIDAK_LOLOS;
        pesanNotif = "Mohon maaf, pendaftaran Anda untuk kelas ini belum lolos tahap seleksi peserta.";
      }

      // Update Database
      const updatedPendaftaran = await prisma.pendaftaran.update({
        where: { id },
        data: { status: statusSesudahnya },
        include: { user: true, event: true, kelasLomba: true }
      });

      // Audit Log
      await auditService.log({
        pendaftaranId: id,
        adminId,
        aksi: parsed.data.status === "LOLOS" ? "SELEKSI_LOLOS" : "SELEKSI_TIDAK_LOLOS",
        statusSebelumnya,
        statusSesudahnya,
        catatan: parsed.data.catatan
      });

      // Trigger Notifikasi Otomatis ke Peserta
      await prisma.notifikasi.create({
        data: {
          userId: pendaftaran.userId,
          pendaftaranId: pendaftaran.id,
          pesan: pesanNotif,
          jenis: JenisNotifikasi.AUTO
        }
      });

      // Enqueue sync Google Sheets
      queueService.enqueueSync(pendaftaran.id);

      res.status(200).json({
        success: true,
        message: `Peserta berhasil ditandai ${parsed.data.status === "LOLOS" ? "Lolos Seleksi" : "Tidak Lolos"}`,
        pendaftaran: updatedPendaftaran
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal memproses seleksi peserta" });
    }
  }

  // 4. Aksi Verifikasi Pembayaran (Approve / Reject)
  async verifikasiPembayaran(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.type === "ADMIN" ? req.user.adminId : undefined;

      const parsed = VerifikasiSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.format() });
        return;
      }

      const pendaftaran = await prisma.pendaftaran.findUnique({
        where: { id },
        include: { user: true, event: true, kelasLomba: true }
      });

      if (!pendaftaran) {
        res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan" });
        return;
      }

      if (pendaftaran.status !== StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN) {
        res.status(400).json({
          success: false,
          message: `Status saat ini "${pendaftaran.status}" tidak dalam antrean verifikasi pembayaran.`
        });
        return;
      }

      const statusSebelumnya = pendaftaran.status as StatusPendaftaran;

      if (parsed.data.status === "APPROVE") {
        // 1. Generate nomor urut sequential per kelas lomba
        const highestOrderRecord = await prisma.pendaftaran.findFirst({
          where: {
            kelasLombaId: pendaftaran.kelasLombaId,
            nomorUrut: { not: null }
          },
          orderBy: { nomorUrut: "desc" }
        });

        const nextNomorUrut = (highestOrderRecord?.nomorUrut || 0) + 1;

        // 2. Generate Surat & Tiket Resmi PDF
        const pdfResult = await pdfService.generateSuratPeserta({
          pendaftaranId: pendaftaran.id,
          nomorRegistrasi: pendaftaran.nomorRegistrasi,
          nomorUrut: nextNomorUrut,
          namaPeserta: pendaftaran.user.nama,
          noHp: pendaftaran.user.noHp,
          namaBurung: pendaftaran.user.namaBurung,
          namaEvent: pendaftaran.event.namaEvent,
          tanggalLomba: pendaftaran.event.tanggalLomba,
          lokasi: pendaftaran.event.lokasi,
          namaKelas: pendaftaran.kelasLomba.namaKelas,
          harga: pendaftaran.kelasLomba.harga,
          eventId: pendaftaran.eventId,
          kelasId: pendaftaran.kelasLombaId
        });

        // 3. Update Pendaftaran ke LUNAS_TERDAFTAR_RESMI
        const updatedPendaftaran = await prisma.pendaftaran.update({
          where: { id },
          data: {
            status: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI,
            nomorUrut: nextNomorUrut,
            suratUrl: pdfResult.relativePath,
            catatanPenolakan: null
          },
          include: { user: true, event: true, kelasLomba: true }
        });

        // 4. Audit Log
        await auditService.log({
          pendaftaranId: id,
          adminId,
          aksi: "VERIFIKASI_APPROVE",
          statusSebelumnya,
          statusSesudahnya: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI,
          catatan: `Disetujui. Diberikan Nomor Gantangan #${nextNomorUrut}. ${parsed.data.catatan || ""}`
        });

        // 5. Notifikasi Otomatis
        await prisma.notifikasi.create({
          data: {
            userId: pendaftaran.userId,
            pendaftaranId: pendaftaran.id,
            pesan: `Pembayaran Anda terverifikasi LUNAS! Anda mendapatkan Nomor Gantangan #${nextNomorUrut}. Surat tiket resmi PDF Anda kini sudah dapat diunduh di dashboard.`,
            jenis: JenisNotifikasi.AUTO
          }
        });

        // 6. Enqueue Google Sheets sync
        queueService.enqueueSync(pendaftaran.id);

        res.status(200).json({
          success: true,
          message: `Pembayaran berhasil diverifikasi. Nomor Urut Gantangan: #${nextNomorUrut}`,
          pendaftaran: updatedPendaftaran
        });
      } else {
        // REJECT PEMBAYARAN
        const alasanTolak = parsed.data.catatan || "Bukti transfer tidak valid atau tidak terbaca.";

        const updatedPendaftaran = await prisma.pendaftaran.update({
          where: { id },
          data: {
            status: StatusPendaftaran.DITOLAK_UPLOAD_ULANG,
            catatanPenolakan: alasanTolak
          },
          include: { user: true, event: true, kelasLomba: true }
        });

        // Audit Log
        await auditService.log({
          pendaftaranId: id,
          adminId,
          aksi: "VERIFIKASI_REJECT",
          statusSebelumnya,
          statusSesudahnya: StatusPendaftaran.DITOLAK_UPLOAD_ULANG,
          catatan: alasanTolak
        });

        // Notifikasi Otomatis
        await prisma.notifikasi.create({
          data: {
            userId: pendaftaran.userId,
            pendaftaranId: pendaftaran.id,
            pesan: `Bukti transfer Anda ditolak: "${alasanTolak}". Silakan unggah ulang bukti transfer yang valid.`,
            jenis: JenisNotifikasi.AUTO
          }
        });

        // Enqueue Google Sheets sync
        queueService.enqueueSync(pendaftaran.id);

        res.status(200).json({
          success: true,
          message: "Bukti transfer berhasil ditolak. Peserta diminta mengunggah ulang bukti pembayaran.",
          pendaftaran: updatedPendaftaran
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal memverifikasi pembayaran" });
    }
  }

  // 5. Statistik Dashboard Admin
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.query;
      const whereEvent: any = eventId ? { eventId: eventId as string } : {};

      const [
        total,
        menungguSeleksi,
        lolosMenungguBayar,
        menungguVerifikasi,
        ditolakUploadUlang,
        lunasResmi,
        tidakLolos
      ] = await Promise.all([
        prisma.pendaftaran.count({ where: whereEvent }),
        prisma.pendaftaran.count({ where: { ...whereEvent, status: StatusPendaftaran.MENUNGGU_SELEKSI } }),
        prisma.pendaftaran.count({ where: { ...whereEvent, status: StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN } }),
        prisma.pendaftaran.count({ where: { ...whereEvent, status: StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN } }),
        prisma.pendaftaran.count({ where: { ...whereEvent, status: StatusPendaftaran.DITOLAK_UPLOAD_ULANG } }),
        prisma.pendaftaran.count({ where: { ...whereEvent, status: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI } }),
        prisma.pendaftaran.count({ where: { ...whereEvent, status: StatusPendaftaran.TIDAK_LOLOS } })
      ]);

      res.status(200).json({
        success: true,
        stats: {
          total,
          menungguSeleksi,
          lolosMenungguBayar,
          menungguVerifikasi,
          ditolakUploadUlang,
          lunasResmi,
          tidakLolos
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil statistik" });
    }
  }
}

export const adminController = new AdminController();
