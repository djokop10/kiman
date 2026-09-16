"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Bird, Smartphone, KeyRound, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [noHp, setNoHp] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const clean = noHp.trim().replace(/\D/g, "");
    if (!clean || clean.length < 9) {
      setErrorMsg("Nomor HP minimal 9 digit");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.requestOtp(clean);
      if (res.success) {
        if (res.code) {
          setSimulatedCode(res.code);
          setOtpCode(res.code); // Auto-fill untuk kemudahan testing
        }
        setStep("OTP");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal meminta kode OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (otpCode.length !== 6) {
      setErrorMsg("Kode OTP harus 6 digit");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyOtp(noHp, otpCode);
      if (res.success && res.token && res.user) {
        loginUser(res.token, res.user);
        router.push("/peserta");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Kode OTP tidak valid atau kedaluwarsa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-3">
          <Bird className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white">Login Peserta</h1>
        <p className="text-sm text-slate-400">
          Masuk dengan Nomor HP & Kode OTP untuk cek status dan upload bukti transfer.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === "PHONE" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? "Mengirim OTP..." : "Kirim Kode OTP"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {simulatedCode && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                <div className="font-bold flex items-center gap-1 mb-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simulasi SMS/WA Gateway:
                </div>
                Kode OTP Anda adalah: <span className="font-mono font-bold text-white text-sm">{simulatedCode}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Masukkan 6 Digit Kode OTP
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-center tracking-widest font-mono text-lg placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("PHONE");
                setOtpCode("");
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Ubah Nomor HP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
