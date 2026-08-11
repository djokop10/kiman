import request from "supertest";
import path from "path";
import fs from "fs";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { StatusPendaftaran } from "../src/types";

describe("Kicau Mania Full End-to-End Workflow API Tests", () => {
  let adminToken: string;
  let superadminToken: string;
  let pesertaToken: string;
  let testEventId: string;
  let testKelasId: string;
  let pendaftaranId: string;

  beforeAll(async () => {
    // Login Admin
    const adminRes = await request(app)
      .post("/api/auth/admin/login")
      .send({ email: "admin@kicaumania.id", password: "admin123" });
    adminToken = adminRes.body.token;

    // Login Superadmin
    const saRes = await request(app)
      .post("/api/auth/admin/login")
      .send({ email: "superadmin@kicaumania.id", password: "superadmin123" });
    superadminToken = saRes.body.token;

    // Ambil Active Event
    const eventsRes = await request(app).get("/api/public/events/active");
    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.events.length).toBeGreaterThan(0);
    testEventId = eventsRes.body.events[0].id;
    testKelasId = eventsRes.body.events[0].kelasList[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1. [PUBLIC] Form Pendaftaran Publik berhasil membuat akun user & record pendaftaran", async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const regRes = await request(app)
      .post("/api/public/pendaftaran")
      .send({
        nama: "Budi Kicau Solo",
        noHp: `08129999${randomSuffix}`,
        namaBurung: "Si Helikopter",
        eventId: testEventId,
        kelasLombaId: testKelasId
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.pendaftaran.status).toBe(StatusPendaftaran.MENUNGGU_SELEKSI);
    expect(regRes.body.token).toBeDefined();

    pendaftaranId = regRes.body.pendaftaran.id;
    pesertaToken = regRes.body.token;
  });

  it("2. [PESERTA] Peserta dapat melihat daftar riwayat pendaftaran di dashboard", async () => {
    const listRes = await request(app)
      .get("/api/peserta/pendaftaran")
      .set("Authorization", `Bearer ${pesertaToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.pendaftaranList.length).toBeGreaterThan(0);
    const current = listRes.body.pendaftaranList.find((p: any) => p.id === pendaftaranId);
    expect(current).toBeDefined();
    expect(current.status).toBe(StatusPendaftaran.MENUNGGU_SELEKSI);
  });

  it("3. [PESERTA] Tidak boleh upload bukti transfer sebelum dinyatakan LOLOS", async () => {
    const dummyFilePath = path.join(__dirname, "test-transfer.png");
    fs.writeFileSync(dummyFilePath, "dummy image content");

    const uploadRes = await request(app)
      .post(`/api/peserta/pendaftaran/${pendaftaranId}/upload-bukti`)
      .set("Authorization", `Bearer ${pesertaToken}`)
      .attach("buktiTransfer", dummyFilePath);

    fs.unlinkSync(dummyFilePath);

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.body.success).toBe(false);
  });

  it("4. [ADMIN] Admin menyeleksi peserta menjadi LOLOS (Auto kirim notif bayar)", async () => {
    const seleksiRes = await request(app)
      .post(`/api/admin/pendaftaran/${pendaftaranId}/seleksi`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "LOLOS", catatan: "Dokumen & kriteria peserta sesuai" });

    expect(seleksiRes.status).toBe(200);
    expect(seleksiRes.body.pendaftaran.status).toBe(StatusPendaftaran.LOLOS_MENUNGGU_PEMBAYARAN);

    // Cek notifikasi peserta
    const notifRes = await request(app)
      .get("/api/peserta/notifikasi")
      .set("Authorization", `Bearer ${pesertaToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.notifikasi[0].pesan).toContain("Anda sudah terpilih untuk mengikuti lomba");
  });

  it("5. [PESERTA] Peserta mengunggah bukti transfer manual", async () => {
    const dummyFilePath = path.join(__dirname, "test-transfer.png");
    fs.writeFileSync(dummyFilePath, "dummy image content");

    const uploadRes = await request(app)
      .post(`/api/peserta/pendaftaran/${pendaftaranId}/upload-bukti`)
      .set("Authorization", `Bearer ${pesertaToken}`)
      .attach("buktiTransfer", dummyFilePath);

    fs.unlinkSync(dummyFilePath);

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.pendaftaran.status).toBe(StatusPendaftaran.MENUNGGU_VERIFIKASI_PEMBAYARAN);
    expect(uploadRes.body.pendaftaran.buktiTransferUrl).toBeDefined();
  });

  it("6. [ADMIN] Admin memverifikasi & menyetujui pembayaran (Auto-generate Nomor Urut & PDF)", async () => {
    const verifyRes = await request(app)
      .post(`/api/admin/pendaftaran/${pendaftaranId}/verifikasi`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVE", catatan: "Transfer Bank BCA Rp 100.000 Terverifikasi Valid" });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.pendaftaran.status).toBe(StatusPendaftaran.LUNAS_TERDAFTAR_RESMI);
    expect(verifyRes.body.pendaftaran.nomorUrut).toBeGreaterThan(0);
    expect(verifyRes.body.pendaftaran.suratUrl).toBeDefined();

    // Verifikasi fisik file PDF yang digenerate di disk
    const pdfPhysicalPath = path.join(process.cwd(), verifyRes.body.pendaftaran.suratUrl);
    expect(fs.existsSync(pdfPhysicalPath)).toBe(true);
  });

  it("7. [PESERTA] Peserta dapat mengunduh surat tiket resmi PDF", async () => {
    const downloadRes = await request(app)
      .get(`/api/peserta/pendaftaran/${pendaftaranId}/surat-pdf`)
      .set("Authorization", `Bearer ${pesertaToken}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers["content-type"]).toBe("application/pdf");
  });

  it("8. [SUPERADMIN] Superadmin dapat melihat rekap laporan finansial & pendaftar", async () => {
    const laporanRes = await request(app)
      .get("/api/superadmin/laporan")
      .set("Authorization", `Bearer ${superadminToken}`);

    expect(laporanRes.status).toBe(200);
    expect(laporanRes.body.summary.totalPesertaLunas).toBeGreaterThan(0);
    expect(laporanRes.body.summary.totalPendapatan).toBeGreaterThan(0);
  });
});
