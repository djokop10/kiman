import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { config } from "../config";

export interface SuratPdfData {
  pendaftaranId: string;
  nomorRegistrasi: string;
  nomorUrut: number;
  namaPeserta: string;
  noHp: string;
  namaBurung?: string | null;
  namaEvent: string;
  tanggalLomba: Date;
  lokasi: string;
  namaKelas: string;
  harga: number;
  eventId: string;
  kelasId: string;
}

export class PdfService {
  async generateSuratPeserta(data: SuratPdfData): Promise<{ relativePath: string; fullPath: string }> {
    // Buat target directory
    const dirPath = path.join(config.storageDir, "surat-pdf", `event-${data.eventId}`, `kelas-${data.kelasId}`);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const fileName = `tiket-${data.nomorRegistrasi}.pdf`;
    const fullPath = path.join(dirPath, fileName);
    const relativePath = `/storage/surat-pdf/event-${data.eventId}/kelas-${data.kelasId}/${fileName}`;

    // Generate QR Code buffer
    const qrPayload = JSON.stringify({
      reg: data.nomorRegistrasi,
      noUrut: data.nomorUrut,
      nama: data.namaPeserta,
      burung: data.namaBurung || "-",
      kelas: data.namaKelas,
      event: data.namaEvent
    });
    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: "#1e293b",
        light: "#ffffff"
      }
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40
      });

      const writeStream = fs.createWriteStream(fullPath);
      doc.pipe(writeStream);

      // --- STYLING & COLORS ---
      const primaryColor = "#0f766e"; // Teal Dark
      const darkColor = "#1e293b";    // Slate 800
      const accentColor = "#d97706";  // Amber
      const lightBg = "#f8fafc";      // Slate 50
      const borderCard = "#e2e8f0";   // Slate 200

      // --- HEADER ---
      doc.rect(40, 40, 515, 75).fill(primaryColor);

      doc.fillColor("#ffffff")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("KICAU MANIA INDONESIA", 55, 55, { align: "left" });

      doc.fontSize(10)
        .font("Helvetica")
        .text("SURAT TIKET & BUKTI PENDAFTARAN RESMI LOMBA BURUNG KLECI", 55, 82, { align: "left" });

      doc.fontSize(9)
        .fillColor("#ccfbf1")
        .text(`No. Registrasi: ${data.nomorRegistrasi}`, 55, 96, { align: "left" });

      // STATUS BADGE DI HEADER KANAN
      doc.rect(410, 55, 130, 26).fillAndStroke("#10b981", "#059669");
      doc.fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("✓ LUNAS / RESMI", 410, 63, { width: 130, align: "center" });

      // --- BADGE NOMOR URUT GANTANGAN ---
      const badgeY = 130;
      doc.rect(40, badgeY, 515, 85).fillAndStroke(lightBg, borderCard);

      doc.fillColor(darkColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("NOMOR GANTANGAN / NOMOR URUT RESMI", 55, badgeY + 12);

      doc.fillColor(accentColor)
        .fontSize(38)
        .font("Helvetica-Bold")
        .text(`NO. ${String(data.nomorUrut).padStart(2, "0")}`, 55, badgeY + 30);

      doc.fillColor("#64748b")
        .fontSize(9)
        .font("Helvetica")
        .text("*Nomor ini wajib ditunjukkan saat menempati nomor gantangan di arena lomba.", 200, badgeY + 45);

      // --- CARD DATA PESERTA & DATA LOMBA ---
      const cardY = 230;
      const colWidth = 245;

      // Box Kiri: Data Peserta
      doc.rect(40, cardY, colWidth, 190).fillAndStroke("#ffffff", borderCard);
      doc.rect(40, cardY, colWidth, 26).fill(darkColor);
      doc.fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("DATA PESERTA", 50, cardY + 8);

      const itemLeftY = cardY + 35;
      const renderRow = (label: string, val: string, yPos: number, xStart = 50) => {
        doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(label, xStart, yPos);
        doc.fillColor(darkColor).fontSize(10).font("Helvetica-Bold").text(val, xStart, yPos + 11);
      };

      renderRow("NAMA PESERTA / PEMILIK", data.namaPeserta, itemLeftY);
      renderRow("NO. WHATSAPP / HP", data.noHp, itemLeftY + 35);
      renderRow("NAMA BURUNG KLECI", data.namaBurung || "(Tanpa Nama)", itemLeftY + 70);
      renderRow("TANGGAL DAFTAR/LUNAS", new Date().toLocaleDateString("id-ID", { dateStyle: "long" }), itemLeftY + 105);

      // Box Kanan: Data Lomba & Kelas
      const colRightX = 310;
      doc.rect(colRightX, cardY, colWidth, 190).fillAndStroke("#ffffff", borderCard);
      doc.rect(colRightX, cardY, colWidth, 26).fill(darkColor);
      doc.fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("DETAIL EVENT & KELAS LOMBA", colRightX + 10, cardY + 8);

      const formattedTgl = new Date(data.tanggalLomba).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      renderRow("EVENT", data.namaEvent, itemLeftY, colRightX + 10);
      renderRow("KELAS LOMBA", data.namaKelas, itemLeftY + 35, colRightX + 10);
      renderRow("TANGGAL & WAKTU", formattedTgl, itemLeftY + 70, colRightX + 10);
      renderRow("LOKASI ARENA", data.lokasi, itemLeftY + 105, colRightX + 10);

      // --- SECTION VALIDASI & QR CODE ---
      const valY = 435;
      doc.rect(40, valY, 515, 140).fillAndStroke(lightBg, borderCard);

      // Gambar QR Code
      doc.image(qrBuffer, 55, valY + 10, { width: 110 });

      doc.fillColor(darkColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("VALIDASI & KETENTUAN PESERTA:", 185, valY + 15);

      const rules = [
        "1. Surat ini merupakan bukti sah pendaftaran dan hak nomor gantangan lomba.",
        "2. Peserta wajib hadir di lokasi lomba minimal 30 menit sebelum sesi kelas dimulai.",
        "3. Tunjukkan QR Code pada tiket ini ke panitia di meja registrasi ulang.",
        "4. Burung kleci wajib dalam kondisi sehat dan sesuai ketentuan pakem penilaian panitia.",
        "5. Tiket yang sudah terdaftar tidak dapat dipindahtangankan tanpa konfirmasi panitia."
      ];

      let rY = valY + 32;
      rules.forEach(rule => {
        doc.fillColor("#475569")
          .fontSize(8)
          .font("Helvetica")
          .text(rule, 185, rY, { width: 350 });
        rY += 16;
      });

      // --- FOOTER & TANDA TANGAN ---
      const footerY = 590;
      doc.rect(40, footerY, 515, 140).fillAndStroke("#ffffff", borderCard);

      doc.fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica")
        .text(`Dokumen ini diterbitkan secara otomatis oleh Sistem Kicau Mania pada ${new Date().toLocaleString("id-ID")}`, 55, footerY + 15);

      doc.fillColor(darkColor)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Panitia Pelaksana Kicau Mania", 400, footerY + 35, { align: "center", width: 140 });

      // Stempel Panitia
      doc.rect(400, footerY + 55, 140, 45).strokeColor("#cbd5e1").stroke();
      doc.fillColor("#94a3b8")
        .fontSize(8)
        .font("Helvetica")
        .text("[ TANDA TANGAN DIGITAL / STEMPEL PANITIA ]", 405, footerY + 70, { align: "center", width: 130 });

      doc.fillColor(darkColor)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("( Panitia Kicau Mania )", 400, footerY + 110, { align: "center", width: 140 });

      doc.end();

      writeStream.on("finish", () => {
        resolve({ relativePath, fullPath });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    });
  }
}

export const pdfService = new PdfService();
