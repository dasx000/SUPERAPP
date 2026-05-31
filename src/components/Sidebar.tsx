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
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
      isActive(href)
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-50"
    }`;

  const navContent = (
    <>
      <div className="p-5 border-b">
        <p className="font-bold text-green-700 text-lg tracking-wide">SUPERAPP</p>
        <p className="text-xs text-gray-400">Sistem Pelayanan Terpadu</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={linkClass("/dashboard")}>
          <span className="w-5 text-center leading-none">⊞</span>
          Dashboard
        </Link>

        <div>
          <div className="flex items-center">
            <Link
              href="/dashboard/ttd"
              onClick={() => { setTtdOpen(true); setMobileOpen(false); }}
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
              <Link href="/dashboard/ttd/upload" onClick={() => setMobileOpen(false)} className={linkClass("/dashboard/ttd/upload")}>
                Upload Dokumen
              </Link>
              {isAdmin && (
                <>
                  <Link href="/dashboard/ttd/antrian" onClick={() => setMobileOpen(false)} className={linkClass("/dashboard/ttd/antrian")}>
                    Antrian
                  </Link>
                  <Link href="/dashboard/ttd/spesimen" onClick={() => setMobileOpen(false)} className={linkClass("/dashboard/ttd/spesimen")}>
                    Spesimen TTD
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <Link href="/dashboard/pengguna" onClick={() => setMobileOpen(false)} className={linkClass("/dashboard/pengguna")}>
            <span className="w-5 text-center leading-none">👥</span>
            Pengguna
          </Link>
        )}

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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-600 hover:text-gray-900 p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className="font-bold text-green-700 tracking-wide">SUPERAPP</p>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-3">
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white shadow-sm flex-col min-h-screen">
        {navContent}
      </aside>
    </>
  );
}
