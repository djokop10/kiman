"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Bird,
  LogOut,
  User,
  ShieldAlert,
  ClipboardList,
  Menu,
  X,
  Sparkles,
  Layers,
  BarChart3
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, userType, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <Bird className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-white tracking-wide flex items-center gap-1.5">
                KICAU MANIA
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  KLECI
                </span>
              </span>
              <span className="text-[11px] text-slate-400 -mt-1">Pendaftaran & Tiket Lomba</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" ? "text-emerald-400 bg-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Beranda
            </Link>

            <Link
              href="/daftar"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/daftar" ? "text-emerald-400 bg-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Daftar Lomba
            </Link>

            {user && userType === "USER" && (
              <Link
                href="/peserta"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === "/peserta" ? "text-emerald-400 bg-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Dashboard Tiket
              </Link>
            )}

            {user && userType === "ADMIN" && (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname === "/admin" ? "text-emerald-400 bg-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Seleksi
                </Link>

                {user.role === "SUPERADMIN" && (
                  <Link
                    href="/superadmin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      pathname === "/superadmin" ? "text-emerald-400 bg-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Superadmin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Profile / Auth Action */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
                    {user.nama?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">{user.nama}</span>
                    <span className="text-[10px] text-slate-400">
                      {userType === "ADMIN" ? (user.role === "SUPERADMIN" ? "Superadmin" : "Panitia") : (user.noHp || "Peserta")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
                >
                  Login Peserta (OTP)
                </Link>
                <Link
                  href="/admin/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-colors"
                >
                  Panitia
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-3 pb-5 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Beranda
          </Link>
          <Link
            href="/daftar"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-400 hover:bg-slate-800"
          >
            Form Pendaftaran Lomba
          </Link>

          {user && userType === "USER" && (
            <Link
              href="/peserta"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              Dashboard Tiket Peserta
            </Link>
          )}

          {user && userType === "ADMIN" && (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Dashboard Admin Seleksi
              </Link>
              {user.role === "SUPERADMIN" && (
                <Link
                  href="/superadmin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
                >
                  Dashboard Superadmin
                </Link>
              )}
            </>
          )}

          <div className="pt-4 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{user.nama}</p>
                  <p className="text-xs text-slate-400">{user.noHp || user.email}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                >
                  Login Peserta (OTP)
                </Link>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg border border-slate-700"
                >
                  Login Panitia
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
