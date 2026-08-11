import React from "react";
import { Clock, XCircle, CheckCircle2, AlertCircle, FileCheck, RefreshCw } from "lucide-react";

export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case "MENUNGGU_SELEKSI":
        return {
          label: "Menunggu Seleksi",
          bg: "bg-amber-950/40 text-amber-300 border-amber-500/30",
          icon: <Clock className="w-3.5 h-3.5 mr-1 animate-pulse text-amber-400" />
        };
      case "TIDAK_LOLOS":
        return {
          label: "Tidak Lolos Seleksi",
          bg: "bg-rose-950/40 text-rose-300 border-rose-500/30",
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
        };
      case "LOLOS_MENUNGGU_PEMBAYARAN":
        return {
          label: "Lolos - Menunggu Pembayaran",
          bg: "bg-blue-950/40 text-blue-300 border-blue-500/30",
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-blue-400" />
        };
      case "MENUNGGU_VERIFIKASI_PEMBAYARAN":
        return {
          label: "Menunggu Verifikasi Admin",
          bg: "bg-purple-950/40 text-purple-300 border-purple-500/30",
          icon: <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin text-purple-400" />
        };
      case "DITOLAK_UPLOAD_ULANG":
        return {
          label: "Ditolak - Upload Ulang",
          bg: "bg-orange-950/40 text-orange-300 border-orange-500/30",
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-orange-400" />
        };
      case "LUNAS_TERDAFTAR_RESMI":
        return {
          label: "Lunas - Terdaftar Resmi",
          bg: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
        };
      default:
        return {
          label: st,
          bg: "bg-slate-800 text-slate-300 border-slate-700",
          icon: null
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs md:text-sm font-medium",
    lg: "px-3 py-1.5 text-sm font-semibold"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} transition-all`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
