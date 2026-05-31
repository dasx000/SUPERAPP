"use client";

import { useState, useEffect } from "react";

type Doc = {
  id: string;
  filename: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
};

export default function TtdUpload() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function fetchDocs() {
    const res = await fetch("/api/ttd/list");
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => { fetchDocs(); }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/ttd/upload", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setMsg("Dokumen berhasil diunggah, menunggu persetujuan admin.");
      (e.target as HTMLFormElement).reset();
      fetchDocs();
    } else {
      setMsg(data.error ?? "Gagal mengunggah");
    }
    setUploading(false);
  }

  const statusBadge: Record<string, string> = {
    MENUNGGU: "bg-yellow-100 text-yellow-700",
    DISETUJUI: "bg-green-100 text-green-700",
    DITOLAK: "bg-red-100 text-red-700",
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Upload Dokumen</h2>
        <form onSubmit={handleUpload} className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              name="file"
              type="file"
              accept=".pdf"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {uploading ? "Mengunggah..." : "Upload"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Dokumen Saya</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada dokumen.</p>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{doc.filename}</p>
                  <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleString("id-ID")}</p>
                  {doc.rejectReason && (
                    <p className="text-xs text-red-500 mt-0.5">Alasan: {doc.rejectReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[doc.status]}`}>
                    {doc.status}
                  </span>
                  {doc.status === "DISETUJUI" && (
                    <a
                      href={`/api/ttd/${doc.id}/download`}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition"
                    >
                      Unduh
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
