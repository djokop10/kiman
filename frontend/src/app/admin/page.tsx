"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  History,
  Download,
  AlertCircle,
  MoreVertical,
  ChevronDown
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, userType, isLoading: authLoading } = useAuth();

  const [pendaftaranList, setPendaftaranList] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [seleksiModalOpen, setSeleksiModalOpen] = useState(false);
  const [verifikasiModalOpen, setVerifikasiModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Active dropdown id
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Form states in modals
  const [seleksiDecision, setSeleksiDecision] = useState<"LOLOS" | "TIDAK_LOLOS">("LOLOS");
  const [seleksiCatatan, setSeleksiCatatan] = useState("");
  const [verifikasiCatatan, setVerifikasiCatatan] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || userType !== "ADMIN") {
        router.push("/admin/login");
      } else {
        loadEventsAndStats();
        loadPendaftaran();
      }
    }
  }, [user, userType, authLoading, selectedEventId, selectedStatus]);

  const loadEventsAndStats = async () => {
    try {
      const [evRes, statsRes] = await Promise.all([
        api.getActiveEvents(),
        api.getAdminStats(selectedEventId || undefined)
      ]);
      if (evRes.success) setEvents(evRes.events || []);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      console.error("Gagal memuat event/stats:", err);
    }
  };

  const loadPendaftaran = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminPendaftaran({
        eventId: selectedEventId || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined
      });
      if (res.success) {
        setPendaftaranList(res.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat pendaftaran:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPendaftaran();
  };

  // Open Seleksi Modal
  const openSeleksi = (item: any) => {
    setSelectedItem(item);
    setSeleksiDecision("LOLOS");
    setSeleksiCatatan("");
    setActionError("");
    setSeleksiModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSeleksiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsProcessing(true);
    setActionError("");
    try {
      const res = await api.seleksiPeserta(selectedItem.id, seleksiDecision, seleksiCatatan);
      if (res.success) {
        setSeleksiModalOpen(false);
        loadPendaftaran();
        loadEventsAndStats();
      }
    } catch (err: any) {
      setActionError(err.message || "Gagal memproses seleksi peserta");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Verifikasi Modal
  const openVerifikasi = (item: any) => {
    setSelectedItem(item);
    setVerifikasiCatatan("");
    setActionError("");
    setVerifikasiModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleVerifikasiSubmit = async (decision: "APPROVE" | "REJECT") => {
    if (!selectedItem) return;

    if (decision === "REJECT" && !verifikasiCatatan.trim()) {
      setActionError("Wajib mengisi alasan penolakan bukti transfer");
      return;
    }

    setIsProcessing(true);
    setActionError("");
    try {
      const res = await api.verifikasiPembayaran(selectedItem.id, decision, verifikasiCatatan);
      if (res.success) {
        setVerifikasiModalOpen(false);
        loadPendaftaran();
        loadEventsAndStats();
      }
    } catch (err: any) {
      setActionError(err.message || "Gagal memproses verifikasi pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Detail / Audit modal
  const openDetail = async (item: any) => {
    try {
      const res = await api.getAdminPendaftaranDetail(item.id);
      if (res.success) {
        setSelectedItem(res.pendaftaran);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error("Gagal mengambil detail:", err);
    }
    setOpenDropdownId(null);
  };

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  if (authLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Memuat portal seleksi...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Seleksi & Verifikasi Peserta</h1>
            <span className="text-xs bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full font-semibold border border-teal-500/30">
              {user?.role === "SUPERADMIN" ? "Superadmin Mode" : "Panitia Lomba"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola seleksi peserta, validasi transfer pembayaran manual, dan terbitkan nomor gantangan.
          </p>
        </div>

        <button
          onClick={() => {
            loadPendaftaran();
            loadEventsAndStats();
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="glass-card p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Pendaftar</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
            <span className="text-[11px] font-semibold text-amber-400 uppercase">Menunggu Seleksi</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">{stats.menungguSeleksi}</div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-950/20">
            <span className="text-[11px] font-semibold text-blue-400 uppercase">Lolos (Belum Bayar)</span>
            <div className="text-xl sm:text-2xl font-bold text-blue-300 mt-1">{stats.lolosMenungguBayar}</div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-purple-500/30 bg-purple-950/20">
            <span className="text-[11px] font-semibold text-purple-400 uppercase">Verifikasi Bukti</span>
            <div className="text-xl sm:text-2xl font-bold text-purple-300 mt-1">{stats.menungguVerifikasi}</div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase">Lunas Resmi</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1">{stats.lunasResmi}</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Event Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">Semua Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.namaEvent}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">Semua Status</option>
              <option value="MENUNGGU_SELEKSI">Menunggu Seleksi</option>
              <option value="LOLOS_MENUNGGU_PEMBAYARAN">Lolos - Menunggu Pembayaran</option>
              <option value="MENUNGGU_VERIFIKASI_PEMBAYARAN">Menunggu Verifikasi Pembayaran</option>
              <option value="DITOLAK_UPLOAD_ULANG">Ditolak - Upload Ulang</option>
              <option value="LUNAS_TERDAFTAR_RESMI">Lunas - Terdaftar Resmi</option>
              <option value="TIDAK_LOLOS">Tidak Lolos</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cari Peserta / No. Reg / HP</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama, no hp, atau KM-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* Participant Table with Dropdown Actions */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-visible">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">No. Registrasi</th>
                <th className="py-3.5 px-4">Peserta & HP</th>
                <th className="py-3.5 px-4">Burung</th>
                <th className="py-3.5 px-4">Kelas & Event</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">No. Gantangan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Memuat data pendaftar...
                  </td>
                </tr>
              ) : pendaftaranList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada pendaftar yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                pendaftaranList.map((p) => {
                  const isMenungguSeleksi = p.status === "MENUNGGU_SELEKSI";
                  const isMenungguVerif = p.status === "MENUNGGU_VERIFIKASI_PEMBAYARAN";
                  const isLunas = p.status === "LUNAS_TERDAFTAR_RESMI";
                  const isDropdownOpen = openDropdownId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{p.nomorRegistrasi}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{p.user?.nama}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.user?.noHp}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{p.user?.namaBurung || "-"}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{p.kelasLomba?.namaKelas}</div>
                        <div className="text-[10px] text-slate-400">{p.event?.namaEvent}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.nomorUrut ? (
                          <span className="font-mono font-extrabold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                            #{String(p.nomorUrut).padStart(2, "0")}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center relative">
                        {/* Dropdown Action Trigger Button */}
                        <div className="inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => toggleDropdown(e, p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
                          >
                            <span>Aksi</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                          </button>

                          {/* Dropdown Menu Popup */}
                          {isDropdownOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-4 mt-1.5 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-slate-950/90 z-50 py-1.5 animate-fadeIn text-left divide-y divide-slate-800"
                            >
                              {/* Option: Seleksi Peserta */}
                              {isMenungguSeleksi && (
                                <div className="py-1">
                                  <button
                                    onClick={() => openSeleksi(p)}
                                    className="w-full px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 flex items-center gap-2 transition-colors"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                    Seleksi Peserta (Lolos / Tolak)
                                  </button>
                                </div>
                              )}

                              {/* Option: Verifikasi Bukti Pembayaran */}
                              {isMenungguVerif && (
                                <div className="py-1">
                                  <button
                                    onClick={() => openVerifikasi(p)}
                                    className="w-full px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-950/40 flex items-center gap-2 transition-colors"
                                  >
                                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                                    Verifikasi Bukti Transfer
                                  </button>
                                </div>
                              )}

                              {/* Option: Unduh Tiket PDF (Jika Lunas) */}
                              {isLunas && p.suratUrl && (
                                <div className="py-1">
                                  <a
                                    href={`http://localhost:5001${p.suratUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpenDropdownId(null)}
                                    className="w-full px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 flex items-center gap-2 transition-colors"
                                  >
                                    <Download className="w-4 h-4 text-emerald-400" />
                                    Unduh Surat & Tiket PDF
                                  </a>
                                </div>
                              )}

                              {/* Option: Lihat Detail & Audit Log */}
                              <div className="py-1">
                                <button
                                  onClick={() => openDetail(p)}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-teal-400" />
                                  Detail & Audit Log
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Seleksi Peserta */}
      <Modal
        isOpen={seleksiModalOpen}
        onClose={() => setSeleksiModalOpen(false)}
        title="Seleksi Peserta Lomba"
        maxWidth="md"
      >
        {selectedItem && (
          <form onSubmit={handleSeleksiSubmit} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div>
                Peserta: <strong className="text-white">{selectedItem.user?.nama}</strong> (
                {selectedItem.user?.noHp})
              </div>
              <div>
                Kelas Lomba: <strong className="text-white">{selectedItem.kelasLomba?.namaKelas}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Keputusan Seleksi:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSeleksiDecision("LOLOS")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    seleksiDecision === "LOLOS"
                      ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lolos Seleksi
                </button>

                <button
                  type="button"
                  onClick={() => setSeleksiDecision("TIDAK_LOLOS")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    seleksiDecision === "TIDAK_LOLOS"
                      ? "bg-rose-950/40 border-rose-500 text-rose-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Tidak Lolos
                </button>
              </div>
            </div>

            {seleksiDecision === "LOLOS" && (
              <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                ⚡ <strong>Auto-Notification:</strong> Sistem akan otomatis mengirim pesan instruksi pembayaran
                dan upload bukti transfer ke akun peserta.
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Catatan Internal (Opsional)
              </label>
              <textarea
                value={seleksiCatatan}
                onChange={(e) => setSeleksiCatatan(e.target.value)}
                placeholder="Tambahkan catatan jika ada..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSeleksiModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {isProcessing ? "Menyimpan..." : "Simpan Keputusan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Verifikasi Pembayaran */}
      <Modal
        isOpen={verifikasiModalOpen}
        onClose={() => setVerifikasiModalOpen(false)}
        title="Verifikasi Pembayaran & Bukti Transfer"
        maxWidth="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gambar Bukti */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">File Bukti Transfer:</span>
                {selectedItem.buktiTransferUrl ? (
                  <div className="space-y-2">
                    <img
                      src={`http://localhost:5001${selectedItem.buktiTransferUrl}`}
                      alt="Bukti Transfer"
                      className="max-h-60 rounded-lg mx-auto border border-slate-700 object-contain"
                    />
                    <a
                      href={`http://localhost:5001${selectedItem.buktiTransferUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-teal-400 hover:underline flex items-center justify-center gap-1"
                    >
                      Buka Gambar Ukuran Penuh
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-8 text-center">Belum ada file bukti transfer</p>
                )}
              </div>

              {/* Rincian Pendaftaran */}
              <div className="space-y-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama Peserta:</span>
                    <span className="font-bold text-white">{selectedItem.user?.nama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. WhatsApp:</span>
                    <span className="font-mono text-white">{selectedItem.user?.noHp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kelas Lomba:</span>
                    <span className="font-semibold text-white">{selectedItem.kelasLomba?.namaKelas}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-400">Nominal Tagihan:</span>
                    <span className="font-bold text-emerald-400">
                      Rp {selectedItem.kelasLomba?.harga.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Catatan / Alasan Penolakan:
                  </label>
                  <textarea
                    value={verifikasiCatatan}
                    onChange={(e) => setVerifikasiCatatan(e.target.value)}
                    placeholder="Wajib diisi jika ditolak (misal: nominal tidak sesuai, bukti buram)..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions: Approve / Reject */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleVerifikasiSubmit("REJECT")}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Tolak & Minta Upload Ulang
              </button>

              <button
                type="button"
                onClick={() => handleVerifikasiSubmit("APPROVE")}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve (Terbitkan No. Gantangan & PDF)
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail & Audit Log */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail & Riwayat Audit Trail"
        maxWidth="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Registrasi:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedItem.nomorRegistrasi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Peserta:</span>
                <span className="font-bold text-white">{selectedItem.user?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Gantangan:</span>
                <span className="font-bold text-amber-400">
                  {selectedItem.nomorUrut ? `#${selectedItem.nomorUrut}` : "Belum terbit"}
                </span>
              </div>
              {selectedItem.suratUrl && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Surat Tiket PDF:</span>
                  <a
                    href={`http://localhost:5001${selectedItem.suratUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </a>
                </div>
              )}
            </div>

            {/* Riwayat Audit Trail */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-400" />
                Audit Trail Perubahan Status:
              </span>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {selectedItem.auditLogs?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Belum ada catatan audit trail.</p>
                ) : (
                  selectedItem.auditLogs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span className="font-semibold text-teal-300">{log.aksi}</span>
                        <span>{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        Status: <span className="text-slate-400">{log.statusSebelumnya}</span> &rarr;{" "}
                        <strong className="text-emerald-400">{log.statusSesudahnya}</strong>
                      </div>
                      {log.admin && (
                        <div className="text-[10px] text-slate-500">
                          Oleh Admin: {log.admin.nama} ({log.admin.email})
                        </div>
                      )}
                      {log.catatan && <p className="text-xs text-amber-200 mt-1 italic">"{log.catatan}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
