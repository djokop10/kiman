"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Bird,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";

function DaftarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedEventId = searchParams.get("eventId");
  const { loginUser } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");

  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [namaBurung, setNamaBurung] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.getActiveEvents();
      if (res.success && res.events.length > 0) {
        setEvents(res.events);
        const defaultEv = preSelectedEventId
          ? res.events.find((e: any) => e.id === preSelectedEventId) || res.events[0]
          : res.events[0];

        setSelectedEventId(defaultEv.id);
        if (defaultEv.kelasList?.length > 0) {
          setSelectedKelasId(defaultEv.kelasList[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat event:", err);
      setErrorMsg("Gagal memuat daftar event lomba");
    }
  };

  const handleEventChange = (eId: string) => {
    setSelectedEventId(eId);
    const ev = events.find((e) => e.id === eId);
    if (ev && ev.kelasList?.length > 0) {
      setSelectedKelasId(ev.kelasList[0].id);
    } else {
      setSelectedKelasId("");
    }
  };

  const currentEvent = events.find((e) => e.id === selectedEventId);
  const currentKelas = currentEvent?.kelasList?.find((k: any) => k.id === selectedKelasId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nama.trim()) {
      setErrorMsg("Nama lengkap peserta wajib diisi");
      return;
    }
    if (!noHp.trim() || noHp.length < 9) {
      setErrorMsg("Nomor HP / WhatsApp minimal 9 digit");
      return;
    }
    if (!selectedEventId || !selectedKelasId) {
      setErrorMsg("Pilih Event dan Kelas Lomba terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitPendaftaran({
        nama: nama.trim(),
        noHp: noHp.trim(),
        namaBurung: namaBurung.trim() || undefined,
        eventId: selectedEventId,
        kelasLombaId: selectedKelasId
      });

      if (res.success) {
        // Otomatis login peserta dengan token yang dikembalikan
        if (res.token && res.user) {
          loginUser(res.token, res.user);
        }
        setSuccessData(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirim formulir pendaftaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Judul & Header Form */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Formulir Pendaftaran Resmi
        </div>
        <h1 className="text-3xl font-extrabold text-white">Daftar Lomba Burung Kleci</h1>
        <p className="text-sm text-slate-400 mt-2">
          Akun dibuat otomatis berdasarkan Nomor HP Anda. Tanpa ribet password!
        </p>
      </div>

      {successData ? (
        <div className="glass-card rounded-2xl p-8 border border-emerald-500/40 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Pendaftaran Berhasil Dikirim!</h2>
            <p className="text-sm text-slate-300">
              Data pendaftaran Anda telah tercatat dan masuk ke antrean seleksi panitia.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-left space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-400">Nomor Registrasi:</span>
              <span className="font-mono font-bold text-emerald-400">{successData.pendaftaran?.nomorRegistrasi}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-400">Nama Peserta:</span>
              <span className="font-semibold text-white">{successData.user?.nama}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-400">Event:</span>
              <span className="font-semibold text-white">{successData.pendaftaran?.event}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-400">Kelas Lomba:</span>
              <span className="font-semibold text-white">{successData.pendaftaran?.kelas}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Status Saat Ini:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-500/30">
                Menunggu Seleksi
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/peserta")}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Buka Dashboard Tiket
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setNamaBurung("");
              }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all"
            >
              Daftar Kelas Lain
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Pilih Event */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Pilih Event Lomba <span className="text-rose-400">*</span>
            </label>
            {events.length === 0 ? (
              <p className="text-xs text-slate-500">Memuat event...</p>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.namaEvent}
                  </option>
                ))}
              </select>
            )}

            {currentEvent && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {new Date(currentEvent.tanggalLomba).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{currentEvent.lokasi}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Pilih Kelas Lomba */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Pilih Kelas Lomba & Tiket <span className="text-rose-400">*</span>
            </label>

            {currentEvent?.kelasList?.length === 0 ? (
              <p className="text-xs text-rose-400">Belum ada kelas yang tersedia pada event ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentEvent?.kelasList?.map((kelas: any) => {
                  const isSelected = selectedKelasId === kelas.id;
                  return (
                    <div
                      key={kelas.id}
                      onClick={() => setSelectedKelasId(kelas.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/50"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-sm text-white">{kelas.namaKelas}</div>
                        <div className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 border-emerald-500">
                          {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Kuota: {kelas.kuota}</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          Rp {kelas.harga.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Identitas Peserta */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Identitas Pemilik & Burung
            </h3>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Nama Lengkap Peserta <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Nomor WhatsApp / HP Aktif <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[11px] text-slate-400">
                *Digunakan untuk verifikasi OTP, status seleksi, dan pengambilan tiket.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Nama Burung Kleci / Pleci <span className="text-slate-500 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={namaBurung}
                onChange={(e) => setNamaBurung(e.target.value)}
                placeholder="Contoh: Si Halilintar"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Rangkuman Harga */}
          {currentKelas && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Biaya Pendaftaran:</span>
                <div className="text-xs text-slate-500">{currentKelas.namaKelas}</div>
              </div>
              <div className="text-xl font-extrabold text-emerald-400">
                Rp {currentKelas.harga.toLocaleString("id-ID")}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Mengirim Pendaftaran...</span>
            ) : (
              <>
                <span>Kirim Pendaftaran Lomba</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function DaftarPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p>Memuat formulir pendaftaran...</p>
        </div>
      }
    >
      <DaftarContent />
    </Suspense>
  );
}
