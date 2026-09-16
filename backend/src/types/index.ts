export enum RoleAdmin {
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN"
}

export enum StatusEvent {
  DRAFT = "DRAFT",
  BUKA = "BUKA",
  BERJALAN = "BERJALAN",
  SELESAI = "SELESAI"
}

export enum StatusPendaftaran {
  MENUNGGU_SELEKSI = "MENUNGGU_SELEKSI",
  TIDAK_LOLOS = "TIDAK_LOLOS",
  LOLOS_MENUNGGU_PEMBAYARAN = "LOLOS_MENUNGGU_PEMBAYARAN",
  MENUNGGU_VERIFIKASI_PEMBAYARAN = "MENUNGGU_VERIFIKASI_PEMBAYARAN",
  DITOLAK_UPLOAD_ULANG = "DITOLAK_UPLOAD_ULANG",
  LUNAS_TERDAFTAR_RESMI = "LUNAS_TERDAFTAR_RESMI"
}

export enum JenisNotifikasi {
  AUTO = "AUTO",
  MANUAL = "MANUAL"
}

export enum SyncStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED"
}

export interface JwtPayloadUser {
  userId: string;
  noHp: string;
  nama: string;
  type: "USER";
}

export interface JwtPayloadAdmin {
  adminId: string;
  email: string;
  nama: string;
  role: RoleAdmin;
  type: "ADMIN";
}

export type AuthUser = JwtPayloadUser | JwtPayloadAdmin;
