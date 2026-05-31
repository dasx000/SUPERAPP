"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

type Props = {
  user: { name: string; email: string; role: string };
};

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
  const [ttdOpen, setTtdOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
      isActive(href)
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <aside className="w-56 bg-white shadow-sm flex flex-col min-h-screen">
      <div className="p-5 border-b">
        <p className="font-bold text-green-700 text-lg tracking-wide">SUPERAPP</p>
        <p className="text-xs text-gray-400">Sistem Pelayanan Terpadu</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {/* Dashboard */}
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <span className="w-5 text-center leading-none">⊞</span>
          Dashboard
        </Link>

        {/* TTD Dokumen */}
        <div>
          <div className="flex items-center">
            <Link
              href="/dashboard/ttd"
              onClick={() => setTtdOpen(true)}
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-l-lg text-sm transition ${
                pathname.startsWith("/dashboard/ttd")
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="w-5 text-center leading-none">✍</span>
              TTD Dokumen
            </Link>
            <button
              onClick={() => setTtdOpen((v) => !v)}
              className={`px-2 py-2 rounded-r-lg text-sm font-bold transition ${
                pathname.startsWith("/dashboard/ttd")
                  ? "bg-green-50 text-green-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {ttdOpen ? "▾" : "▸"}
            </button>
          </div>

          {ttdOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-gray-100 pl-3">
              <Link href="/dashboard/ttd/upload" className={linkClass("/dashboard/ttd/upload")}>
                Upload Dokumen
              </Link>
              {isAdmin && (
                <>
                  <Link href="/dashboard/ttd/antrian" className={linkClass("/dashboard/ttd/antrian")}>
                    Antrian
                  </Link>
                  <Link href="/dashboard/ttd/spesimen" className={linkClass("/dashboard/ttd/spesimen")}>
                    Spesimen TTD
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pengguna */}
        {isAdmin && (
          <Link href="/dashboard/pengguna" className={linkClass("/dashboard/pengguna")}>
            <span className="w-5 text-center leading-none">👥</span>
            Pengguna
          </Link>
        )}

        {/* Smart LTT */}
        <a
          href="https://sites.google.com/view/laporan-ltt/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition text-gray-600 hover:bg-gray-50"
        >
          <span className="w-5 text-center leading-none">📊</span>
          Smart LTT
        </a>
      </nav>

      <div className="p-3 border-t">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
