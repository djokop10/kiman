import { google } from "googleapis";
import { config } from "../config";

export interface SheetRowData {
  nomorRegistrasi: string;
  namaPeserta: string;
  noHp: string;
  namaBurung?: string | null;
  namaEvent: string;
  namaKelas: string;
  harga: number;
  status: string;
  nomorUrut?: number | null;
  buktiTransferUrl?: string | null;
  suratUrl?: string | null;
  updatedAt: Date;
}

export class SheetService {
  private isConfigured(): boolean {
    return Boolean(
      config.google.serviceAccountEmail &&
      config.google.privateKey &&
      config.google.spreadsheetId
    );
  }

  async syncPendaftaranToSheet(data: SheetRowData): Promise<{ success: boolean; message: string; mock?: boolean }> {
    if (!this.isConfigured()) {
      console.log(`[GoogleSheets:MOCK] Data disinkronkan ke Sheet:`, {
        reg: data.nomorRegistrasi,
        nama: data.namaPeserta,
        status: data.status,
        noUrut: data.nomorUrut || "-"
      });
      return {
        success: true,
        message: "Google Sheets Credentials belum dikonfigurasi. Mode MOCK aktif.",
        mock: true
      };
    }

    try {
      const auth = new google.auth.JWT({
        email: config.google.serviceAccountEmail,
        key: config.google.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });

      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = config.google.spreadsheetId;

      // 1. Pastikan Header Sheet sudah ada di sheet pertama
      const sheetName = "Pendaftaran_Lomba";
      const headerRow = [
        "Waktu Update",
        "No. Registrasi",
        "Nama Peserta",
        "No. HP",
        "Nama Burung",
        "Nama Event",
        "Kelas Lomba",
        "Harga Tiket (Rp)",
        "Status Pendaftaran",
        "No. Gantangan",
        "Bukti Transfer URL",
        "Surat Tiket PDF URL"
      ];

      // Format baris data
      const rowValues = [
        new Date(data.updatedAt).toLocaleString("id-ID"),
        data.nomorRegistrasi,
        data.namaPeserta,
        `'${data.noHp}`,
        data.namaBurung || "-",
        data.namaEvent,
        data.namaKelas,
        data.harga,
        data.status,
        data.nomorUrut ? `#${data.nomorUrut}` : "-",
        data.buktiTransferUrl ? `${config.baseUrl}${data.buktiTransferUrl}` : "-",
        data.suratUrl ? `${config.baseUrl}${data.suratUrl}` : "-"
      ];

      // Cek apakah data nomor registrasi sudah ada di sheet untuk diupdate (upsert row)
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:L`
      });

      const rows = readRes.data.values || [];
      let targetRowIndex = -1;

      if (rows.length === 0) {
        // Sheet kosong, buat header
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [headerRow]
          }
        });
      } else {
        // Cari baris berdasarkan Nomor Registrasi (Kolom B / index 1)
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][1] === data.nomorRegistrasi) {
            targetRowIndex = i + 1; // 1-indexed for Sheets API
            break;
          }
        }
      }

      if (targetRowIndex > 0) {
        // Update baris yang sudah ada
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${targetRowIndex}:L${targetRowIndex}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowValues]
          }
        });
      } else {
        // Append baris baru
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:L`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowValues]
          }
        });
      }

      console.log(`[GoogleSheets:SUCCESS] Berhasil menyinkronkan data ${data.nomorRegistrasi}`);
      return { success: true, message: "Berhasil sinkronisasi ke Google Sheet" };
    } catch (err: any) {
      console.error("[GoogleSheets:ERROR] Gagal sinkronisasi:", err?.message || err);
      throw new Error(`Google Sheets Sync Error: ${err?.message || "Unknown error"}`);
    }
  }
}

export const sheetService = new SheetService();
