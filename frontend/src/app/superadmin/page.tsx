"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  BarChart3,
  Calendar,
  Layers,
  Users,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  Eye,
  Download,
  AlertCircle,
  ExternalLink,
  History,
  TrendingUp,
  DollarSign,
  ChevronDown
} from "lucide-react";

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const { user, userType, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"laporan" | "seleksi" | "events" | "kelas" | "admins" | "sheets">("laporan");

  // Data states
  const [laporanData, setLaporanData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [pendaftaranList, setPendaftaranList] = useState<any[]>([]);
  const [sheetSyncStats, setSheetSyncStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Pendaftaran
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [kelasModalOpen, setKelasModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [seleksiModalOpen, setSeleksiModalOpen] = useState(false);
  const [verifikasiModalOpen, setVerifikasiModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedPendaftaran, setSelectedPendaftaran] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Form states
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");

  const [kelasEventId, setKelasEventId] = useState("");
  const [kelasName, setKelasName] = useState("");
  const [kelasPrice, setKelasPrice] = useState<number>(50000);
  const [kelasQuota, setKelasQuota] = useState<number>(40);

  const [adminNama, setAdminNama] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRole, setAdminRole] = useState<"ADMIN" | "SUPERADMIN">("ADMIN");

  // Action modal states
  const [seleksiDecision, setSeleksiDecision] = useState<"LOLOS" | "TIDAK_LOLOS">("LOLOS");
  const [seleksiCatatan, setSeleksiCatatan] = useState("");
  const [verifikasiCatatan, setVerifikasiCatatan] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || userType !== "ADMIN" || user.role !== "SUPERADMIN") {
        router.push("/admin/login");
      } else {
        loadAllData();
      }
    }
  }, [user, userType, authLoading, selectedEventId, selectedStatus]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [lapRes, evRes, klRes, admRes, sheetRes, pendRes] = await Promise.all([
        api.getLaporan(),
        api.getEvents(),
        api.getKelas(),
        api.getAdmins(),
        api.getSyncStatus(),
        api.getAdminPendaftaran({
          eventId: selectedEventId || undefined,
          status: selectedStatus || undefined,
          search: searchQuery || undefined
        })
      ]);

      if (lapRes.success) setLaporanData(lapRes);
      if (evRes.success) setEvents(evRes.events || []);
      if (klRes.success) setKelasList(klRes.kelasList || []);
      if (admRes.success) setAdmins(admRes.admins || []);
      if (sheetRes.success) setSheetSyncStats(sheetRes.stats);
      if (pendRes.success) setPendaftaranList(pendRes.data || []);
    } catch (err) {
      console.error("Gagal memuat data superadmin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendaftaranOnly = async () => {
    try {
      const res = await api.getAdminPendaftaran({
        eventId: selectedEventId || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined
      });
      if (res.success) setPendaftaranList(res.data || []);
    } catch (err) {
      console.error("Gagal memuat pendaftaran:", err);
    }
  };

  // === SELEKSI & VERIFIKASI HANDLERS ===
  const openSeleksi = (item: any) => {
    setSelectedPendaftaran(item);
    setSeleksiDecision("LOLOS");
    setSeleksiCatatan("");
    setActionError("");
    setSeleksiModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSeleksiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendaftaran) return;

    setIsProcessing(true);
    setActionError("");
    try {
      const res = await api.seleksiPeserta(selectedPendaftaran.id, seleksiDecision, seleksiCatatan);
      if (res.success) {
        setSeleksiModalOpen(false);
        setFeedbackMsg(`Berhasil menandai peserta ${seleksiDecision === "LOLOS" ? "Lolos Seleksi" : "Tidak Lolos"}`);
        loadAllData();
        setTimeout(() => setFeedbackMsg(""), 4000);
      }
    } catch (err: any) {
      setActionError(err.message || "Gagal memproses seleksi");
    } finally {
      setIsProcessing(false);
    }
  };

  const openVerifikasi = (item: any) => {
    setSelectedPendaftaran(item);
    setVerifikasiCatatan("");
    setActionError("");
    setVerifikasiModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleVerifikasiSubmit = async (decision: "APPROVE" | "REJECT") => {
    if (!selectedPendaftaran) return;

    if (decision === "REJECT" && !verifikasiCatatan.trim()) {
      setActionError("Wajib mengisi alasan penolakan bukti transfer");
      return;
    }

    setIsProcessing(true);
    setActionError("");
    try {
      const res = await api.verifikasiPembayaran(selectedPendaftaran.id, decision, verifikasiCatatan);
      if (res.success) {
        setVerifikasiModalOpen(false);
        setFeedbackMsg(`Pembayaran berhasil ${decision === "APPROVE" ? "Disetujui & Nomor Gantangan Terbit" : "Ditolak"}`);
        loadAllData();
        setTimeout(() => setFeedbackMsg(""), 4000);
      }
    } catch (err: any) {
      setActionError(err.message || "Gagal memproses verifikasi");
    } finally {
      setIsProcessing(false);
    }
  };

  const openDetail = async (item: any) => {
    try {
      const res = await api.getAdminPendaftaranDetail(item.id);
      if (res.success) {
        setSelectedPendaftaran(res.pendaftaran);
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

  // === EVENT HANDLERS ===
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (editingItem) {
        await api.updateEvent(editingItem.id, {
          namaEvent: eventName,
          tanggalLomba: eventDate,
          lokasi: eventLocation,
          deskripsi: eventDesc
        });
      } else {
        await api.createEvent({
          namaEvent: eventName,
          tanggalLomba: eventDate,
          lokasi: eventLocation,
          deskripsi: eventDesc
        });
      }
      setEventModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan event");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Yakin ingin menghapus event ini beserta seluruh kelas lombanya?")) return;
    try {
      await api.deleteEvent(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus event");
    }
  };

  // === KELAS HANDLERS ===
  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (editingItem) {
        await api.updateKelas(editingItem.id, {
          namaKelas: kelasName,
          harga: Number(kelasPrice),
          kuota: Number(kelasQuota)
        });
      } else {
        await api.createKelas({
          eventId: kelasEventId,
          namaKelas: kelasName,
          harga: Number(kelasPrice),
          kuota: Number(kelasQuota)
        });
      }
      setKelasModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan kelas");
    }
  };

  const handleDeleteKelas = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kelas lomba ini?")) return;
    try {
      await api.deleteKelas(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus kelas");
    }
  };

  // === ADMIN HANDLERS ===
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.createAdmin({
        nama: adminNama,
        email: adminEmail,
        password: adminPassword,
        role: adminRole
      });
      setAdminModalOpen(false);
      setAdminNama("");
      setAdminEmail("");
      setAdminPassword("");
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat admin");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Yakin ingin menghapus akun admin ini?")) return;
    try {
      await api.deleteAdmin(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus admin");
    }
  };

  // === GOOGLE SHEETS TRIGGER ===
  const handleTriggerSyncAll = async () => {
    try {
      const res = await api.triggerSyncAll();
      setFeedbackMsg(res.message);
      loadAllData();
      setTimeout(() => setFeedbackMsg(""), 5000);
    } catch (err: any) {
      alert(err.message || "Gagal menjadwalkan sinkronisasi");
    }
  };

  if (authLoading || isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Memuat data superadmin...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Dashboard Superadmin</h1>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/30">
              Master Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola Seleksi & Verifikasi Peserta, Master Event & Kelas, Akun Panitia, Rekap Finansial, dan Google Sheets Sync.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("laporan")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "laporan"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Laporan & Finansial
        </button>

        <button
          onClick={() => setActiveTab("seleksi")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "seleksi"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          Seleksi & Pendaftar ({pendaftaranList.length})
        </button>

        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "events"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Master Event ({events.length})
        </button>

        <button
          onClick={() => setActiveTab("kelas")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "kelas"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          Kelas & Kuota ({kelasList.length})
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "admins"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Kelola Admin ({admins.length})
        </button>

        <button
          onClick={() => setActiveTab("sheets")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "sheets"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Google Sheet Sync
        </button>
      </div>

      {/* TAB 1: LAPORAN & FINANSIAL */}
      {activeTab === "laporan" && laporanData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Total Pendapatan Terverifikasi
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                Rp {laporanData.summary?.totalPendapatan?.toLocaleString("id-ID") || 0}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 space-y-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Peserta Lunas / Gantangan Terisi
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {laporanData.summary?.totalPesertaLunas || 0} Peserta
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Total Formulir Masuk
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {laporanData.summary?.totalPendaftar || 0} Pendaftar
              </div>
            </div>
          </div>

          {laporanData.laporanEvent?.map((ev: any) => (
            <div key={ev.eventId} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{ev.namaEvent}</h3>
                  <p className="text-xs text-slate-400">
                    {new Date(ev.tanggalLomba).toLocaleDateString("id-ID", { dateStyle: "full" })} • {ev.lokasi}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Pendapatan Event:</span>
                  <div className="text-base font-bold text-emerald-400">
                    Rp {ev.pendapatan.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {ev.rekapKelas?.map((k: any) => (
                  <div key={k.kelasId} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white text-sm">{k.namaKelas}</span>
                        <span className="text-slate-400 ml-2">(@ Rp {k.harga.toLocaleString("id-ID")})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400">
                          {k.terisi} / {k.kuota} Gantangan ({k.persentaseTerisi}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, k.persentaseTerisi)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Total Masuk: {k.totalPendaftar} | Menunggu Seleksi: {k.menungguSeleksi} | Menunggu Bayar: {k.menungguBayar}</span>
                      <span className="font-bold text-white">Subtotal: Rp {k.pendapatan.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SELEKSI & PENDAFTAR (SUPERADMIN BISA MENYELEKSI) */}
      {activeTab === "seleksi" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Semua Event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.namaEvent}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
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

              <div className="sm:col-span-2 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cari Peserta / No. Reg</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nama, No. HP, atau KM-..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <button
                  onClick={loadPendaftaranOnly}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>

          {/* Table with Dropdown Actions */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-visible">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">No. Registrasi</th>
                    <th className="py-3.5 px-4">Peserta & HP</th>
                    <th className="py-3.5 px-4">Burung</th>
                    <th className="py-3.5 px-4">Kelas Lomba</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">No. Gantangan</th>
                    <th className="py-3.5 px-4 text-center">Aksi Superadmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendaftaranList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Tidak ada pendaftar yang sesuai filter.
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
                            {/* Dropdown Action Trigger */}
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
                                        Unduh Tiket PDF
                                      </a>
                                    </div>
                                  )}

                                  <div className="py-1">
                                    <button
                                      onClick={() => openDetail(p)}
                                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                    >
                                      <Eye className="w-4 h-4 text-amber-400" />
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
        </div>
      )}

      {/* TAB 3: MASTER EVENT */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Daftar Event Lomba</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setEventName("");
                setEventDate("");
                setEventLocation("");
                setEventDesc("");
                setEventModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Event Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-base">{ev.namaEvent}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {ev.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{ev.deskripsi || "Tanpa deskripsi"}</p>

                <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                  <div>Tanggal: {new Date(ev.tanggalLomba).toLocaleDateString("id-ID", { dateStyle: "long" })}</div>
                  <div>Lokasi: {ev.lokasi}</div>
                  <div>Kelas Lomba: {ev.kelasList?.length || 0} Kelas</div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingItem(ev);
                      setEventName(ev.namaEvent);
                      setEventDate(ev.tanggalLomba ? new Date(ev.tanggalLomba).toISOString().slice(0, 10) : "");
                      setEventLocation(ev.lokasi);
                      setEventDesc(ev.deskripsi || "");
                      setEventModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-2 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-900/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: KELAS & KUOTA */}
      {activeTab === "kelas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Daftar Kelas Lomba & Harga</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setKelasEventId(events[0]?.id || "");
                setKelasName("");
                setKelasPrice(50000);
                setKelasQuota(40);
                setKelasModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelas Lomba
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4">Nama Kelas</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Harga Tiket</th>
                  <th className="py-3 px-4">Kuota Gantangan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {kelasList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-semibold text-white">{k.namaKelas}</td>
                    <td className="py-3 px-4 text-slate-300">{k.event?.namaEvent}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">Rp {k.harga.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 font-mono text-white">{k.kuota} Gantangan</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteKelas(k.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: KELOLA ADMIN */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Akun Panitia & Superadmin</h2>
            <button
              onClick={() => {
                setAdminNama("");
                setAdminEmail("");
                setAdminPassword("");
                setAdminRole("ADMIN");
                setAdminModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Admin Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {admins.map((adm) => (
              <div key={adm.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{adm.nama}</h3>
                    <p className="text-xs text-slate-400">{adm.email}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      adm.role === "SUPERADMIN"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/30"
                    }`}
                  >
                    {adm.role}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  <span>Dibuat: {new Date(adm.createdAt).toLocaleDateString("id-ID")}</span>
                  {adm.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteAdmin(adm.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: GOOGLE SHEETS SYNC */}
      {activeTab === "sheets" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Status Sinkronisasi Google Sheets API
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Semua perubahan status pendaftaran otomatis dikirimkan ke antrean sinkronisasi background worker.
                </p>
              </div>

              <button
                onClick={handleTriggerSyncAll}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Jadwalkan Sync Ulang Seluruh Data
              </button>
            </div>

            {sheetSyncStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Antrean Jobs</span>
                  <div className="text-lg font-bold text-white">{sheetSyncStats.total}</div>
                </div>
                <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-400">Sukses Sinkron</span>
                  <div className="text-lg font-bold text-emerald-300">{sheetSyncStats.success}</div>
                </div>
                <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/20">
                  <span className="text-[11px] text-amber-400">Pending Worker</span>
                  <div className="text-lg font-bold text-amber-300">{sheetSyncStats.pending}</div>
                </div>
                <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-500/20">
                  <span className="text-[11px] text-rose-400">Gagal / Retry</span>
                  <div className="text-lg font-bold text-rose-300">{sheetSyncStats.failed}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Seleksi Peserta */}
      <Modal
        isOpen={seleksiModalOpen}
        onClose={() => setSeleksiModalOpen(false)}
        title="Seleksi Peserta (Superadmin)"
        maxWidth="md"
      >
        {selectedPendaftaran && (
          <form onSubmit={handleSeleksiSubmit} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div>
                Peserta: <strong className="text-white">{selectedPendaftaran.user?.nama}</strong> (
                {selectedPendaftaran.user?.noHp})
              </div>
              <div>
                Kelas: <strong className="text-white">{selectedPendaftaran.kelasLomba?.namaKelas}</strong>
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

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Catatan Internal (Opsional)
              </label>
              <textarea
                value={seleksiCatatan}
                onChange={(e) => setSeleksiCatatan(e.target.value)}
                placeholder="Catatan seleksi..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
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
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
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
        title="Verifikasi Pembayaran (Superadmin)"
        maxWidth="lg"
      >
        {selectedPendaftaran && (
          <div className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Foto Bukti Transfer:</span>
                {selectedPendaftaran.buktiTransferUrl ? (
                  <div className="space-y-2">
                    <img
                      src={`http://localhost:5001${selectedPendaftaran.buktiTransferUrl}`}
                      alt="Bukti Transfer"
                      className="max-h-60 rounded-lg mx-auto border border-slate-700 object-contain"
                    />
                    <a
                      href={`http://localhost:5001${selectedPendaftaran.buktiTransferUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center justify-center gap-1"
                    >
                      Buka Ukuran Penuh
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-8 text-center">Belum ada file bukti</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Peserta:</span>
                    <span className="font-bold text-white">{selectedPendaftaran.user?.nama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. HP:</span>
                    <span className="font-mono text-white">{selectedPendaftaran.user?.noHp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kelas:</span>
                    <span className="font-semibold text-white">{selectedPendaftaran.kelasLomba?.namaKelas}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-400">Harga:</span>
                    <span className="font-bold text-emerald-400">
                      Rp {selectedPendaftaran.kelasLomba?.harga.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Catatan / Alasan Tolak:
                  </label>
                  <textarea
                    value={verifikasiCatatan}
                    onChange={(e) => setVerifikasiCatatan(e.target.value)}
                    placeholder="Wajib jika ditolak..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

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
                Approve (Terbitkan Gantangan & PDF)
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
        {selectedPendaftaran && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Registrasi:</span>
                <span className="font-mono font-bold text-amber-400">{selectedPendaftaran.nomorRegistrasi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Peserta:</span>
                <span className="font-bold text-white">{selectedPendaftaran.user?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Gantangan:</span>
                <span className="font-bold text-amber-400">
                  {selectedPendaftaran.nomorUrut ? `#${selectedPendaftaran.nomorUrut}` : "Belum terbit"}
                </span>
              </div>
              {selectedPendaftaran.suratUrl && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Surat Tiket PDF:</span>
                  <a
                    href={`http://localhost:5001${selectedPendaftaran.suratUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                Audit Trail Perubahan Status:
              </span>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {selectedPendaftaran.auditLogs?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Belum ada catatan audit trail.</p>
                ) : (
                  selectedPendaftaran.auditLogs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span className="font-semibold text-amber-300">{log.aksi}</span>
                        <span>{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        Status: <span className="text-slate-400">{log.statusSebelumnya}</span> &rarr;{" "}
                        <strong className="text-emerald-400">{log.statusSesudahnya}</strong>
                      </div>
                      {log.admin && (
                        <div className="text-[10px] text-slate-500">
                          Oleh: {log.admin.nama} ({log.admin.role})
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

      {/* Modal Buat / Edit Event */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingItem ? "Edit Event Lomba" : "Buat Event Lomba Baru"}
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Nama Event</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Piala Raja Kleci 2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Tanggal Pelaksanaan</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Lokasi Gantangan</label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Lapangan Banteng, Jakarta"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Deskripsi Event</label>
            <textarea
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="Keterangan aturan lomba dan hadiah..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEventModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Simpan Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Kelas */}
      <Modal
        isOpen={kelasModalOpen}
        onClose={() => setKelasModalOpen(false)}
        title="Tambah Kelas Lomba"
      >
        <form onSubmit={handleSaveKelas} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Pilih Event</label>
            <select
              value={kelasEventId}
              onChange={(e) => setKelasEventId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.namaEvent}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Nama Kelas</label>
            <input
              type="text"
              value={kelasName}
              onChange={(e) => setKelasName(e.target.value)}
              placeholder="Kelas Utama - Raja Gantangan (A)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Harga Tiket (Rp)</label>
              <input
                type="number"
                value={kelasPrice}
                onChange={(e) => setKelasPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Kuota Gantangan</label>
              <input
                type="number"
                value={kelasQuota}
                onChange={(e) => setKelasQuota(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setKelasModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Admin */}
      <Modal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title="Tambah Akun Panitia / Admin"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Nama Panitia</label>
            <input
              type="text"
              value={adminNama}
              onChange={(e) => setAdminNama(e.target.value)}
              placeholder="Admin Lapangan"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Email Panitia</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="panitia@kicaumania.id"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Role</label>
            <select
              value={adminRole}
              onChange={(e) => setAdminRole(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ADMIN">Panitia / Admin</option>
              <option value="SUPERADMIN">Superadmin</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAdminModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Buat Akun
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
