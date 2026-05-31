"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/pengguna").then((r) => r.json()).then(setUsers);
  }, []);

  const roleBadge: Record<string, string> = {
    SUPERADMIN: "bg-purple-100 text-purple-700",
    ADMIN: "bg-blue-100 text-blue-700",
    PENYULUH: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Pengguna</h1>
      <p className="text-gray-500 text-sm mb-6">Daftar seluruh pengguna sistem</p>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        {users.length === 0 && (
          <p className="p-5 text-sm text-gray-400">Belum ada pengguna.</p>
        )}
        {users.map((user) => (
          <div key={user.id} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[user.role] ?? "bg-gray-100 text-gray-600"}`}>
              {user.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
