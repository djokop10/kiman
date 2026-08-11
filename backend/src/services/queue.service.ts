import { prisma } from "../lib/prisma";
import { sheetService } from "./sheet.service";
import { SyncStatus } from "../types";

export class QueueService {
  private isProcessing = false;

  async enqueueSync(pendaftaranId: string) {
    try {
      // Masukkan ke antrean DB
      const queueItem = await prisma.sheetSyncQueue.create({
        data: {
          pendaftaranId,
          status: SyncStatus.PENDING,
          retryCount: 0
        }
      });

      // Trigger pemrosesan background secara asinkron (non-blocking)
      setImmediate(() => {
        this.processQueue().catch((err) => {
          console.error("[QueueService] Error saat memproses queue:", err);
        });
      });

      return queueItem;
    } catch (err) {
      console.error("[QueueService] Gagal menambahkan item ke queue:", err);
    }
  }

  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Ambil semua item yang pending atau gagal dengan retry < 3
      const pendingItems = await prisma.sheetSyncQueue.findMany({
        where: {
          OR: [
            { status: SyncStatus.PENDING },
            { status: SyncStatus.FAILED, retryCount: { lt: 3 } }
          ]
        },
        include: {
          pendaftaran: {
            include: {
              user: true,
              event: true,
              kelasLomba: true
            }
          }
        },
        take: 10,
        orderBy: { createdAt: "asc" }
      });

      for (const item of pendingItems) {
        if (!item.pendaftaran) {
          await prisma.sheetSyncQueue.update({
            where: { id: item.id },
            data: { status: SyncStatus.FAILED, errorMsg: "Pendaftaran tidak ditemukan" }
          });
          continue;
        }

        try {
          await sheetService.syncPendaftaranToSheet({
            nomorRegistrasi: item.pendaftaran.nomorRegistrasi,
            namaPeserta: item.pendaftaran.user.nama,
            noHp: item.pendaftaran.user.noHp,
            namaBurung: item.pendaftaran.user.namaBurung,
            namaEvent: item.pendaftaran.event.namaEvent,
            namaKelas: item.pendaftaran.kelasLomba.namaKelas,
            harga: item.pendaftaran.kelasLomba.harga,
            status: item.pendaftaran.status,
            nomorUrut: item.pendaftaran.nomorUrut,
            buktiTransferUrl: item.pendaftaran.buktiTransferUrl,
            suratUrl: item.pendaftaran.suratUrl,
            updatedAt: item.pendaftaran.updatedAt
          });

          // Update status queue sukses
          await prisma.sheetSyncQueue.update({
            where: { id: item.id },
            data: {
              status: SyncStatus.SUCCESS,
              syncedAt: new Date(),
              errorMsg: null
            }
          });
        } catch (syncErr: any) {
          await prisma.sheetSyncQueue.update({
            where: { id: item.id },
            data: {
              status: SyncStatus.FAILED,
              retryCount: item.retryCount + 1,
              errorMsg: syncErr?.message || "Gagal sinkronisasi"
            }
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async getSyncStats() {
    const total = await prisma.sheetSyncQueue.count();
    const success = await prisma.sheetSyncQueue.count({ where: { status: SyncStatus.SUCCESS } });
    const pending = await prisma.sheetSyncQueue.count({ where: { status: SyncStatus.PENDING } });
    const failed = await prisma.sheetSyncQueue.count({ where: { status: SyncStatus.FAILED } });
    const recent = await prisma.sheetSyncQueue.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        pendaftaran: {
          select: {
            nomorRegistrasi: true,
            status: true,
            user: { select: { nama: true } }
          }
        }
      }
    });

    return { total, success, pending, failed, recent };
  }
}

export const queueService = new QueueService();
