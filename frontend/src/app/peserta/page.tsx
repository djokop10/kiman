"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  Bird,
  UploadCloud,
  Download,
  Bell,
  Clock,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileText,
  CreditCard,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function PesertaDashboardPage() {
  const router = useRouter();
  const { user, userType, isLoading: authLoading } = useAuth();

  const [pendaftaranList, setPendaftaranList] = useState<any[]>([]);
  const [notifikasiList, setNotifikasiList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedPendaftaran, setSelectedPendaftaran] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user || userType !== "USER") {
        router.push("/login");
      } else {
        loadData();
      }
    }
  }, [user, userType, authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendRes, notifRes] = await Promise.all([
        api.getMyPendaftaran(),
        api.getMyNotifikasi()
      ]);

      if (pendRes.success) setPendaftaranList(pendRes.pendaftaranList || []);
      if (notifRes.success) setNotifikasiList(notifRes.notifikasi || []);
    } catch (err) {
      console.error("Gagal memuat dashboard peserta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUpload = (p: any) => {
    setSelectedPendaftaran(p);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError("");
    setUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedPendaftaran) {
      setUploadError("Pilih file bukti transfer terlebih dahulu");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("buktiTransfer", selectedFile);

      const res = await api.uploadBuktiTransfer(selectedPendaftaran.id, formData);
      if (res.success) {
        setUploadModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah bukti transfer");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPdf = (pendaftaranId: string) => {
    const token = localStorage.getItem("km_token");
    window.open(`http://localhost:5001/api/peserta/pendaftaran/${pendaftaranId}/surat-pdf?token=${token}`, "_blank");
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-slate-400">
        Memuat dashboard peserta...
      </div>
    );
  }

  const unreadNotifCount = notifikasiList.filter((n) => !n.dibaca).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-emerald-950/60">
            <Bird className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{user?.nama}</h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                Peserta
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              No. WhatsApp: <span className="text-slate-300 font-mono">{user?.noHp}</span>
              {user?.namaBurung && ` • Burung: ${user.namaBurung}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setNotifModalOpen(true)}
            className="relative px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            Notifikasi
            {unreadNotifCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => router.push("/daftar")}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 flex-1 md:flex-none justify-center"
          >
            Daftar Lomba Baru
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Registrations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Riwayat Pendaftaran Tiket Lomba
          </h2>
          <span className="text-xs text-slate-400">Total: {pendaftaranList.length} Pendaftaran</span>
        </div>

        {pendaftaranList.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
            <Bird className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-300 font-semibold">Belum Ada Riwayat Pendaftaran</p>
              <p className="text-xs text-slate-500">
                Pilih event lomba kleci dan daftarkan burung andalan Anda sekarang juga.
              </p>
            </div>
            <button
              onClick={() => router.push("/daftar")}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              Daftar Lomba Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pendaftaranList.map((p) => {
              const isLolosBayar = p.status === "LOLOS_MENUNGGU_PEMBAYARAN";
              const isDitolak = p.status === "DITOLAK_UPLOAD_ULANG";
              const isVerifikasi = p.status === "MENUNGGU_VERIFIKASI_PEMBAYARAN";
              const isLunas = p.status === "LUNAS_TERDAFTAR_RESMI";

              return (
                <div
                  key={p.id}
                  className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800/90 hover:border-slate-700 transition-all space-y-5"
                >
                  {/* Top Bar: Reg Code & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        No. Registrasi
                      </span>
                      <div className="font-mono font-bold text-white text-base sm:text-lg">
                        {p.nomorRegistrasi}
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={p.status} size="lg" />
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-slate-400">Event Lomba:</span>
                      <div className="font-semibold text-white text-sm">{p.event?.namaEvent}</div>
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        {new Date(p.event?.tanggalLomba).toLocaleDateString("id-ID", {
                          dateStyle: "medium"
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span className="truncate">{p.event?.lokasi}</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-slate-400">Kelas & Biaya:</span>
                      <div className="font-semibold text-white text-sm">{p.kelasLomba?.namaKelas}</div>
                      <div className="font-bold text-emerald-400 text-sm mt-1">
                        Rp {p.kelasLomba?.harga.toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-center">
                      <span className="text-slate-400">Nomor Gantangan:</span>
                      {p.nomorUrut ? (
                        <div className="text-2xl font-extrabold text-amber-400 font-mono">
                          NO. {String(p.nomorUrut).padStart(2, "0")}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          Diberikan otomatis setelah pembayaran diverifikasi
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Alerts for Action */}
                  {isDitolak && p.catatanPenolakan && (
                    <div className="p-3.5 bg-orange-950/40 border border-orange-500/30 rounded-xl text-xs text-orange-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-orange-200">Bukti Transfer Ditolak:</div>
                        <p className="mt-0.5">{p.catatanPenolakan}</p>
                      </div>
                    </div>
                  )}

                  {isLolosBayar && (
                    <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 space-y-2">
                      <div className="font-bold text-blue-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        Selamat! Anda telah lolos seleksi panitia.
                      </div>
                      <p>
                        Silakan lakukan pembayaran sebesar{" "}
                        <strong className="text-white">
                          Rp {p.kelasLomba?.harga.toLocaleString("id-ID")}
                        </strong>{" "}
                        dan unggah foto/screenshot bukti transfer di bawah ini.
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {(isLolosBayar || isDitolak) && (
                      <button
                        onClick={() => handleOpenUpload(p)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40"
                      >
                        <UploadCloud className="w-4 h-4" />
                        {isDitolak ? "Upload Ulang Bukti Transfer" : "Upload Bukti Transfer"}
                      </button>
                    )}

                    {isVerifikasi && (
                      <div className="text-xs text-purple-300 flex items-center gap-2 bg-purple-950/30 px-3.5 py-2 rounded-xl border border-purple-500/20">
                        <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                        Bukti transfer sedang diverifikasi oleh panitia lomba
                      </div>
                    )}

                    {isLunas && (
                      <button
                        onClick={() => handleDownloadPdf(p.id)}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40"
                      >
                        <Download className="w-4 h-4" />
                        Unduh Surat & Tiket Resmi (PDF)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Upload Bukti Transfer */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Bukti Pembayaran Transfer"
        maxWidth="md"
      >
        {selectedPendaftaran && (
          <form onSubmit={handleUploadSubmit} className="space-y-5">
            {uploadError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Detail Rekening Panitia */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Rekening Pembayaran Resmi Panitia:
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div>
                    <span className="font-bold text-white">Bank BCA</span>
                    <p className="text-[11px] text-slate-400">a.n Panitia Kicau Mania Indonesia</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">8870-1234-5678</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div>
                    <span className="font-bold text-white">Bank Mandiri</span>
                    <p className="text-[11px] text-slate-400">a.n Kicau Mania Official</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">137-00-9876-5432</span>
                </div>
              </div>

              <div className="text-right text-xs pt-1">
                <span className="text-slate-400">Nominal Transfer: </span>
                <span className="font-extrabold text-white">
                  Rp {selectedPendaftaran.kelasLomba?.harga.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Input File */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Pilih Foto Bukti Transfer (JPG, PNG, PDF maks 5MB)
              </label>

              <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Preview Bukti"
                      className="max-h-40 rounded-lg mx-auto border border-slate-700"
                    />
                    <span className="text-xs text-emerald-400 font-semibold block">
                      Klik untuk ganti file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">
                      Klik untuk memilih file struk / screenshot transfer
                    </p>
                    <p className="text-[11px] text-slate-500">Mendukung format gambar dan PDF</p>
                  </div>
                )}
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isUploading ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Notifikasi */}
      <Modal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        title="Riwayat Pesan & Notifikasi"
        maxWidth="md"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {notifikasiList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Belum ada notifikasi.</p>
          ) : (
            notifikasiList.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-emerald-400">Pemberitahuan Sistem</span>
                  <span>{new Date(n.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{n.pesan}</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
