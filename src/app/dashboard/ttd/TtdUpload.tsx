"use client";

import { useState, useEffect, useRef } from "react";

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
  const [replacing, setReplacing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceDocId = useRef<string>("");

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
      setPage(1);
      fetchDocs();
    } else {
      setMsg(data.error ?? "Gagal mengunggah");
    }
    setUploading(false);
  }

  function openPreview(docId: string) {
    window.open(`/api/ttd/${docId}/preview`, "_blank");
  }

  function triggerReplace(docId: string) {
    replaceDocId.current = docId;
    replaceInputRef.current?.click();
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = replaceDocId.current;
    setReplacing(id);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/ttd/${id}/replace`, { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setMsg("File berhasil diganti, preview sedang dibuat...");
      fetchDocs();
    } else {
      setMsg(data.error ?? "Gagal mengganti file");
    }
    setReplacing(null);
    e.target.value = "";
  }

  const statusBadge: Record<string, string> = {
    MENUNGGU: "bg-yellow-100 text-yellow-700",
    DISETUJUI: "bg-green-100 text-green-700",
    DITOLAK: "bg-red-100 text-red-700",
  };

  return (
    <>
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleReplace}
      />

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Upload Dokumen</h2>
        <form onSubmit={handleUpload} className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              name="file"
              type="file"
              accept=".pdf"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
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
          <>
            <div className="space-y-3">
              {docs.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((doc) => (
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
                    {(doc.status === "MENUNGGU" || doc.status === "DITOLAK") && (
                      <>
                        <button
                          onClick={() => openPreview(doc.id)}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => triggerReplace(doc.id)}
                          disabled={replacing === doc.id}
                          className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition disabled:opacity-50"
                        >
                          {replacing === doc.id ? "Mengganti..." : "Ganti File"}
                        </button>
                      </>
                    )}
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

            {docs.length > PER_PAGE && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <p className="text-xs text-gray-400">
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, docs.length)} dari {docs.length} dokumen
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.ceil(docs.length / PER_PAGE) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-xs rounded-lg border transition ${
                        p === page
                          ? "bg-green-600 text-white border-green-600"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === Math.ceil(docs.length / PER_PAGE)}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
