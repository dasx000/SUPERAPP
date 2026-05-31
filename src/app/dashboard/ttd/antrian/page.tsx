"use client";

import { useState, useEffect } from "react";

type Doc = {
  id: string;
  filename: string;
  status: string;
  createdAt: string;
  uploader: { name: string };
};

export default function AntrianPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function fetchDocs() {
    const res = await fetch("/api/ttd/list");
    if (res.ok) setDocs((await res.json()).filter((d: Doc) => d.status === "MENUNGGU"));
  }

  useEffect(() => { fetchDocs(); }, []);

  async function handleApprove(id: string) {
    setLoading(true);
    await fetch(`/api/ttd/${id}/approve`, { method: "POST" });
    await fetchDocs();
    setLoading(false);
  }

  async function handleReject() {
    if (!rejectId) return;
    setLoading(true);
    await fetch(`/api/ttd/${rejectId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejectId(null);
    setRejectReason("");
    await fetchDocs();
    setLoading(false);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Antrian Persetujuan</h1>
      <p className="text-gray-500 text-sm mb-6">Dokumen yang menunggu ACC tanda tangan</p>

      <div className="bg-white rounded-xl shadow-sm p-5">
        {docs.length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada dokumen dalam antrian.</p>
        ) : (
          <div className="space-y-4">
            {docs.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{doc.filename}</p>
                    <p className="text-xs text-gray-400">
                      {doc.uploader.name} · {new Date(doc.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <a
                    href={`/api/ttd/${doc.id}/preview`}
                    target="_blank"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Lihat PDF
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(doc.id)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    ACC
                  </button>
                  <button
                    onClick={() => setRejectId(doc.id)}
                    disabled={loading}
                    className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-3">Alasan Penolakan</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Tuliskan alasan penolakan..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                Tolak Dokumen
              </button>
              <button
                onClick={() => setRejectId(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
