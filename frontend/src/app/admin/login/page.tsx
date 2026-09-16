"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    setIsLoading(true);
    try {
      const res = await api.loginAdmin(email, password);
      if (res.success && res.token && res.admin) {
        loginAdmin(res.token, res.admin);
        if (res.admin.role === "SUPERADMIN") {
          router.push("/superadmin");
        } else {
          router.push("/admin");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Email atau password salah");
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (role: "admin" | "superadmin") => {
    if (role === "superadmin") {
      setEmail("superadmin@kicaumania.id");
      setPassword("superadmin123");
    } else {
      setEmail("admin@kicaumania.id");
      setPassword("admin123");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white">Login Portal Panitia</h1>
        <p className="text-sm text-slate-400">
          Khusus Admin Seleksi, Verifikasi Pembayaran & Superadmin
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Email Panitia</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kicaumania.id"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Fill Credentials for Dev & Testing */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 block text-center uppercase tracking-wider">
            Akun Default (Demo Testing)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
            >
              Panitia / Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("superadmin")}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
            >
              Superadmin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
