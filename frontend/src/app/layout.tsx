import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Kicau Mania - Pendaftaran Lomba Burung Kleci",
  description: "Platform resmi pendaftaran, seleksi, dan penerbitan tiket nomor urut lomba burung pleci/kleci terpercaya.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
