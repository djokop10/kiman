"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Bird,
  Calendar,
  MapPin,
  Tag,
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  Users,
  CheckCircle2,
  Trophy,
  Search
} from "lucide-react";

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState("");

  useEffect(() => {
    loadActiveEvents();
  }, []);

  const loadActiveEvents = async () => {
    try {
      const res = await api.getActiveEvents();
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error("Gagal memuat event aktif:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Official Portal Lomba Burung Kleci / Pleci Indonesia
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Pendaftaran Lomba & <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                Tiket Gantangan Resmi
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Daftar lomba burung kleci dengan mudah tanpa ribet. Seleksi transparan, verifikasi pembayaran cepat,
              dan nomor urut gantangan beserta surat resmi langsung terbit otomatis.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/daftar"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Daftar Lomba Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
              >
                Cek Tiket / Upload Bukti
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Sistem */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Alur Pendaftaran Praktis & Transparan
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Dari pendaftaran hingga gantangan, semua serba otomatis dan terpantau jelas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Daftar Tanpa Password</h3>
            <p className="text-sm text-slate-400">
              Cukup masukkan Nama & Nomor HP. Akun dibuat otomatis dan login berikutnya menggunakan kode OTP instan.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Seleksi Panitia</h3>
            <p className="text-sm text-slate-400">
              Panitia menyeleksi data peserta secara adil. Saat lolos, peserta langsung mendapat notifikasi untuk transfer.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Upload Bukti Transfer</h3>
            <p className="text-sm text-slate-400">
              Unggah foto struk/screenshot transfer langsung lewat smartphone Anda tanpa perlu chat manual ke panitia.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">4. Tiket & No. Urut Otomatis</h3>
            <p className="text-sm text-slate-400">
              Saat pembayaran disetujui, nomor gantangan sequential dan PDF tiket resmi QR Code langsung terbit.
            </p>
          </div>
        </div>
      </section>

      {/* Daftar Event Aktif */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              JADWAL LOMBA MENDATANG
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Event Lomba Kleci Aktif
            </h2>
          </div>

          <Link
            href="/daftar"
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
          >
            Lihat Semua Form Pendaftaran
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Memuat data event...</div>
        ) : events.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl">
            <Bird className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Belum ada event lomba yang dibuka saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="glass-card rounded-2xl p-6 md:p-8 flex flex-col justify-between border border-slate-800 hover:border-emerald-500/30 transition-all shadow-xl shadow-slate-950/50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                      PENDAFTARAN BUKA
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {event._count?.pendaftaran || 0} Pendaftar
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white">{event.namaEvent}</h3>

                  <p className="text-sm text-slate-300 line-clamp-2">{event.deskripsi}</p>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center text-xs text-slate-400 gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        {new Date(event.tanggalLomba).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    <div className="flex items-center text-xs text-slate-400 gap-2">
                      <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{event.lokasi}</span>
                    </div>
                  </div>

                  {/* List Kelas Lomba */}
                  <div className="pt-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Kelas Lomba & Tiket:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {event.kelasList?.map((kelas: any) => (
                        <div
                          key={kelas.id}
                          className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                              {kelas.namaKelas}
                            </div>
                            <div className="text-[11px] text-slate-400">Kuota: {kelas.kuota} Gantangan</div>
                          </div>
                          <div className="text-xs font-bold text-emerald-400">
                            Rp {kelas.harga.toLocaleString("id-ID")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <Link
                    href={`/daftar?eventId=${event.id}`}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    Daftar di Event Ini
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
