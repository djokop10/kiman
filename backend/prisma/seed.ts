import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { pdfService } from "../src/services/pdf.service";
import { StatusPendaftaran, StatusEvent, RoleAdmin, JenisNotifikasi } from "../src/types";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data dummy lengkap Kicau Mania...");

  // Reset data lama jika ada
  await prisma.sheetSyncQueue.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notifikasi.deleteMany();
  await prisma.pendaftaran.deleteMany();
  await prisma.kelasLomba.deleteMany();
  await prisma.event.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.otpCode.deleteMany();

  // 1. SEED 5 AKUN ADMIN & PANITIA
  console.log("👤 Membuat 5 Akun Admin / Panitia...");
  const salt = await bcrypt.genSalt(10);
  const passSuper = await bcrypt.hash("superadmin123", salt);
  const passAdmin = await bcrypt.hash("admin123", salt);

  const superadmin = await prisma.admin.create({
    data: {
      nama: "Superadmin Kicau Mania",
      email: "superadmin@kicaumania.id",
      passwordHash: passSuper,
      role: RoleAdmin.SUPERADMIN
    }
  });

  const admin1 = await prisma.admin.create({
    data: {
      nama: "Admin Panitia Seleksi",
      email: "admin@kicaumania.id",
      passwordHash: passAdmin,
      role: RoleAdmin.ADMIN
    }
  });

  const admin2 = await prisma.admin.create({
    data: {
      nama: "Bambang Keuangan",
      email: "keuangan@kicaumania.id",
      passwordHash: passAdmin,
      role: RoleAdmin.ADMIN
    }
  });

  const admin3 = await prisma.admin.create({
    data: {
      nama: "Joko Lapangan Gantangan",
      email: "lapangan@kicaumania.id",
      passwordHash: passAdmin,
      role: RoleAdmin.ADMIN
    }
  });

  const admin4 = await prisma.admin.create({
    data: {
      nama: "Rudi Registrasi Ulang",
      email: "registrasi@kicaumania.id",
      passwordHash: passAdmin,
      role: RoleAdmin.ADMIN
    }
  });

  // 2. SEED 5 EVENT LOMBA
  console.log("🏆 Membuat 5 Event Lomba...");
  const event1 = await prisma.event.create({
    data: {
      namaEvent: "Piala Raja Kleci Nusantara 2026",
      tanggalLomba: new Date("2026-09-20T08:00:00.000Z"),
      lokasi: "Gantangan Lapangan Banteng, Jakarta Pusat",
      deskripsi: "Lomba Burung Kleci / Pleci Tingkat Nasional. Rebutkan Piala Bergilir & Total Hadiah Rp 50.000.000!",
      status: StatusEvent.BUKA
    }
  });

  const event2 = await prisma.event.create({
    data: {
      namaEvent: "Grand Prix Pleci Mania Jawa Barat 2026",
      tanggalLomba: new Date("2026-10-15T09:00:00.000Z"),
      lokasi: "Gantangan Sabilulungan, Soreang, Bandung",
      deskripsi: "Ajang silaturahmi & adu kicau merdu burung kleci se-Jawa Barat. Tertib, transparan, dan fair play.",
      status: StatusEvent.BUKA
    }
  });

  const event3 = await prisma.event.create({
    data: {
      namaEvent: "Liga Kicau Pleci Jawa Tengah & DIY 2026",
      tanggalLomba: new Date("2026-11-08T08:30:00.000Z"),
      lokasi: "Arena Gantangan PRPP Semarang, Jawa Tengah",
      deskripsi: "Pesta kicaumania pleci terbesar di Jateng & DIY dengan juri independen bersertifikat nasional.",
      status: StatusEvent.BUKA
    }
  });

  const event4 = await prisma.event.create({
    data: {
      namaEvent: "Bupati Cup Kleci Jawa Timur 2026",
      tanggalLomba: new Date("2026-12-05T09:00:00.000Z"),
      lokasi: "Gantangan Gelora Delta Sidoarjo, Jawa Timur",
      deskripsi: "Perebutan gelar juara umum single fighter & bird club se-Jawa Timur.",
      status: StatusEvent.BUKA
    }
  });

  const event5 = await prisma.event.create({
    data: {
      namaEvent: "Road to Kleci Master Indonesia Season 2",
      tanggalLomba: new Date("2026-12-27T08:00:00.000Z"),
      lokasi: "Gantangan Manahan Solo, Jawa Tengah",
      deskripsi: "Ajang penutupan akhir tahun kasta tertinggi burung kleci master Indonesia.",
      status: StatusEvent.BUKA
    }
  });

  // 3. SEED 5 KELAS LOMBA PER EVENT
  console.log("🎫 Membuat 5 Kelas Lomba pada Event Utama...");
  const kelasUtama = await prisma.kelasLomba.create({
    data: {
      eventId: event1.id,
      namaKelas: "Kelas Kleci Utama - Raja Gantangan (A)",
      harga: 100000,
      kuota: 36
    }
  });

  const kelasBintang = await prisma.kelasLomba.create({
    data: {
      eventId: event1.id,
      namaKelas: "Kelas Kleci Bintang Lapangan (B)",
      harga: 75000,
      kuota: 48
    }
  });

  const kelasPemula = await prisma.kelasLomba.create({
    data: {
      eventId: event1.id,
      namaKelas: "Kelas Kleci Pemula Pro (C)",
      harga: 50000,
      kuota: 60
    }
  });

  const kelasBebas = await prisma.kelasLomba.create({
    data: {
      eventId: event1.id,
      namaKelas: "Kelas Kleci Bebas Aksi (D)",
      harga: 35000,
      kuota: 60
    }
  });

  const kelasKomunitas = await prisma.kelasLomba.create({
    data: {
      eventId: event1.id,
      namaKelas: "Kelas Pleci Komunitas Bersatu (E)",
      harga: 25000,
      kuota: 60
    }
  });

  // Tambahkan kelas untuk event lainnya
  await prisma.kelasLomba.createMany({
    data: [
      { eventId: event2.id, namaKelas: "Kelas Pleci Champion Jabar (A)", harga: 80000, kuota: 40 },
      { eventId: event2.id, namaKelas: "Kelas Pleci Komunitas Jabar (B)", harga: 50000, kuota: 50 },
      { eventId: event3.id, namaKelas: "Kelas Pleci Jateng Gayeng (A)", harga: 85000, kuota: 40 },
      { eventId: event4.id, namaKelas: "Kelas Kleci Suroboyoan (A)", harga: 90000, kuota: 45 },
      { eventId: event5.id, namaKelas: "Kelas Master Solo Spirit (A)", harga: 120000, kuota: 36 }
    ]
  });

  // 4. SEED 5+ USERS PESERTA
  console.log("👥 Membuat 6 Akun Peserta...");
  const user1 = await prisma.user.create({
    data: {
      nama: "Budi Santoso",
      noHp: "081234567890",
      namaBurung: "Si Halilintar"
    }
  });

  const user2 = await prisma.user.create({
    data: {
      nama: "Agus Setiawan",
      noHp: "081298765432",
      namaBurung: "Raja Tembak"
    }
  });

  const user3 = await prisma.user.create({
    data: {
      nama: "Hendra Wijaya",
      noHp: "081311223344",
      namaBurung: "Suara Petir"
    }
  });

  const user4 = await prisma.user.create({
    data: {
      nama: "Dimas Pratama",
      noHp: "081566778899",
      namaBurung: "Pleci Sakti"
    }
  });

  const user5 = await prisma.user.create({
    data: {
      nama: "Rian Hidayat",
      noHp: "081822334455",
      namaBurung: "Kicau Emas"
    }
  });

  const user6 = await prisma.user.create({
    data: {
      nama: "Eko Saputra",
      noHp: "081900112233",
      namaBurung: "Bravo"
    }
  });

  // Buat dummy bukti transfer fisik sederhana
  const sampleUploadDir = path.join(process.cwd(), "storage", "bukti-transfer", "sample");
  if (!fs.existsSync(sampleUploadDir)) fs.mkdirSync(sampleUploadDir, { recursive: true });
  const sampleProofPath = path.join(sampleUploadDir, "struk-transfer-sample.png");
  fs.writeFileSync(sampleProofPath, "DUMMY BUKTI TRANSFER IMAGE CONTENT");

  // 5. SEED 6 PENDAFTARAN DENGAN SEMUA VARIASI STATUS STATE MACHINE
  console.log("📝 Membuat 6 Pendaftaran dengan Variasi Status Lengkap...");

  // Data 1: LUNAS_TERDAFTAR_RESMI (Gantangan #01 + Generate PDF Tiket Asli)
  const reg1Number = "KM-20260810-1001";
  const pdf1 = await pdfService.generateSuratPeserta({
    pendaftaranId: "sample-pendaftaran-1",
    nomorRegistrasi: reg1Number,
    nomorUrut: 1,
    namaPeserta: user1.nama,
    noHp: user1.noHp,
    namaBurung: user1.namaBurung,
    namaEvent: event1.namaEvent,
    tanggalLomba: event1.tanggalLomba,
    lokasi: event1.lokasi,
    namaKelas: kelasUtama.namaKelas,
    harga: kelasUtama.harga,
    eventId: event1.id,
    kelasId: kelasUtama.id
  });

  const pendaftaran1 = await prisma.pendaftaran.create({
    data: {
      userId: user1.id,
      eventId: event1.id,
      kelasLombaId: kelasUtama.id,
      nomorRegistrasi: reg1Number,
      status: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI,
      nomorUrut: 1,
      buktiTransferUrl: "/storage/bukti-transfer/sample/struk-transfer-sample.png",
      suratUrl: pdf1.relativePath
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        pendaftaranId: pendaftaran1.id,
        adminId: admin1.id,
        aksi: "SELEKSI_LOLOS",
        statusSebelumnya: StatusPendaftaran.MENUNGGU_SELEKSI,
        statusSesudahnya: StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN,
        catatan: "Kriteria peserta & burung sesuai"
      },
      {
        pendaftaranId: pendaftaran1.id,
        adminId: admin2.id,
        aksi: "VERIFIKASI_APPROVE",
        statusSebelumnya: StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN,
        statusSesudahnya: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI,
        catatan: "Transfer BCA Rp 100.000 telah lunas. Nomor Gantangan #01 diterbitkan."
      }
    ]
  });

  await prisma.notifikasi.create({
    data: {
      userId: user1.id,
      pendaftaranId: pendaftaran1.id,
      pesan: `Pembayaran Anda terverifikasi LUNAS! Anda mendapatkan Nomor Gantangan #1. Tiket resmi PDF dapat diunduh.`,
      jenis: JenisNotifikasi.AUTO
    }
  });

  // Data 2: LUNAS_TERDAFTAR_RESMI (Gantangan #02 + Generate PDF)
  const reg2Number = "KM-20260810-1002";
  const pdf2 = await pdfService.generateSuratPeserta({
    pendaftaranId: "sample-pendaftaran-2",
    nomorRegistrasi: reg2Number,
    nomorUrut: 2,
    namaPeserta: user2.nama,
    noHp: user2.noHp,
    namaBurung: user2.namaBurung,
    namaEvent: event1.namaEvent,
    tanggalLomba: event1.tanggalLomba,
    lokasi: event1.lokasi,
    namaKelas: kelasUtama.namaKelas,
    harga: kelasUtama.harga,
    eventId: event1.id,
    kelasId: kelasUtama.id
  });

  const pendaftaran2 = await prisma.pendaftaran.create({
    data: {
      userId: user2.id,
      eventId: event1.id,
      kelasLombaId: kelasUtama.id,
      nomorRegistrasi: reg2Number,
      status: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI,
      nomorUrut: 2,
      buktiTransferUrl: "/storage/bukti-transfer/sample/struk-transfer-sample.png",
      suratUrl: pdf2.relativePath
    }
  });

  await prisma.auditLog.create({
    data: {
      pendaftaranId: pendaftaran2.id,
      adminId: admin2.id,
      aksi: "VERIFIKASI_APPROVE",
      statusSebelumnya: StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN,
      statusSesudahnya: StatusPendaftaran.LUNAS_TERDAFTAR_RESMI,
      catatan: "Transfer Mandiri Rp 100.000 Terverifikasi."
    }
  });

  // Data 3: MENUNGGU_VERIFIKASI_PEMBAYARAN (Bukti sudah upload, siap diverifikasi admin)
  const pendaftaran3 = await prisma.pendaftaran.create({
    data: {
      userId: user3.id,
      eventId: event1.id,
      kelasLombaId: kelasBintang.id,
      nomorRegistrasi: "KM-20260810-1003",
      status: StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN,
      buktiTransferUrl: "/storage/bukti-transfer/sample/struk-transfer-sample.png"
    }
  });

  await prisma.auditLog.create({
    data: {
      pendaftaranId: pendaftaran3.id,
      adminId: admin1.id,
      aksi: "SELEKSI_LOLOS",
      statusSebelumnya: StatusPendaftaran.MENUNGGU_SELEKSI,
      statusSesudahnya: StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN,
      catatan: "Peserta lolos tahap seleksi"
    }
  });

  // Data 4: LOLOS_MENUNGGU_PEMBAYARAN (Peserta baru lolos seleksi, belum upload bukti)
  const pendaftaran4 = await prisma.pendaftaran.create({
    data: {
      userId: user4.id,
      eventId: event1.id,
      kelasLombaId: kelasPemula.id,
      nomorRegistrasi: "KM-20260810-1004",
      status: StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN
    }
  });

  await prisma.notifikasi.create({
    data: {
      userId: user4.id,
      pendaftaranId: pendaftaran4.id,
      pesan: "Anda sudah terpilih untuk mengikuti lomba, silakan lakukan pembayaran dan upload bukti transfer.",
      jenis: JenisNotifikasi.AUTO
    }
  });

  // Data 5: DITOLAK_UPLOAD_ULANG (Bukti transfer ditolak admin dengan catatan)
  const pendaftaran5 = await prisma.pendaftaran.create({
    data: {
      userId: user5.id,
      eventId: event1.id,
      kelasLombaId: kelasBebas.id,
      nomorRegistrasi: "KM-20260810-1005",
      status: StatusPendaftaran.DITOLAK_UPLOAD_ULANG,
      buktiTransferUrl: "/storage/bukti-transfer/sample/struk-transfer-sample.png",
      catatanPenolakan: "Foto struk transfer tidak terbaca dan nominal tidak sesuai (kurang Rp 5.000)."
    }
  });

  await prisma.auditLog.create({
    data: {
      pendaftaranId: pendaftaran5.id,
      adminId: admin2.id,
      aksi: "VERIFIKASI_REJECT",
      statusSebelumnya: StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN,
      statusSesudahnya: StatusPendaftaran.DITOLAK_UPLOAD_ULANG,
      catatan: "Foto struk transfer tidak terbaca dan nominal tidak sesuai (kurang Rp 5.000)."
    }
  });

  // Data 6: MENUNGGU_SELEKSI (Baru daftar dari form publik)
  const pendaftaran6 = await prisma.pendaftaran.create({
    data: {
      userId: user6.id,
      eventId: event1.id,
      kelasLombaId: kelasKomunitas.id,
      nomorRegistrasi: "KM-20260810-1006",
      status: StatusPendaftaran.MENUNGGU_SELEKSI
    }
  });

  await prisma.notifikasi.create({
    data: {
      userId: user6.id,
      pendaftaranId: pendaftaran6.id,
      pesan: `Pendaftaran Anda untuk event "${event1.namaEvent}" (${kelasKomunitas.namaKelas}) berhasil diterima. Menunggu proses seleksi oleh panitia.`,
      jenis: JenisNotifikasi.AUTO
    }
  });

  console.log("==================================================");
  console.log("✅ BERHASIL SEED DATA DUMMY:");
  console.log(`   - 5 Akun Admin & Superadmin`);
  console.log(`   - 5 Event Lomba Aktif`);
  console.log(`   - 10 Kelas Lomba dengan Kuota & Harga`);
  console.log(`   - 6 User Peserta`);
  console.log(`   - 6 Data Pendaftaran dengan seluruh variasi status state machine:`);
  console.log(`     * Lunas Resmi (#01 & #02) + File PDF Tiket & QR Code`);
  console.log(`     * Menunggu Verifikasi Pembayaran`);
  console.log(`     * Lolos - Menunggu Pembayaran`);
  console.log(`     * Ditolak - Upload Ulang`);
  console.log(`     * Menunggu Seleksi`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding dummy data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
