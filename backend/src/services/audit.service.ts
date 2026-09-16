import { prisma } from "../lib/prisma";
import { StatusPendaftaran } from "../types";

export interface LogAuditParams {
  pendaftaranId: string;
  adminId?: string;
  aksi: string;
  statusSebelumnya: StatusPendaftaran;
  statusSesudahnya: StatusPendaftaran;
  catatan?: string;
}

export class AuditService {
  async log(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          pendaftaranId: params.pendaftaranId,
          adminId: params.adminId || null,
          aksi: params.aksi,
          statusSebelumnya: params.statusSebelumnya,
          statusSesudahnya: params.statusSesudahnya,
          catatan: params.catatan || null
        }
      });
    } catch (err) {
      console.error("[AuditService] Gagal mencatat audit log:", err);
    }
  }

  async getHistoryByPendaftaran(pendaftaranId: string) {
    return prisma.auditLog.findMany({
      where: { pendaftaranId },
      include: {
        admin: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  }
}

export const auditService = new AuditService();
