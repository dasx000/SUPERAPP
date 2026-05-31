"use client";

import { useState, useEffect, useRef } from "react";

export default function SpesimenPage() {
  const [hasSpesimen, setHasSpesimen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function checkSpesimen() {
    const res = await fetch("/api/ttd/spesimen");
    if (res.ok) {
      const blob = await res.blob();
      setImgUrl(URL.createObjectURL(blob));
      setHasSpesimen(true);
    } else {
      setHasSpesimen(false);
      setImgUrl(null);
    }
  }

  useEffect(() => { checkSpesimen(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg(null);

    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/ttd/spesimen", { method: "POST", body: form });
    const data = await res.json();

    setMsg({ text: data.message ?? data.error, ok: res.ok });
    if (res.ok) await checkSpesimen();
    if (inputRef.current) inputRef.current.value = "";
    setUploading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Spesimen TTD</h1>
      <p className="text-gray-500 text-sm mb-6">
        Tanda tangan resmi atas nama <span className="font-medium text-gray-700">KATIMKER</span> yang akan distempel pada dokumen yang disetujui.
      </p>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Spesimen saat ini</p>
          {hasSpesimen && imgUrl ? (
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-32">
              <img src={imgUrl} alt="Spesimen TTD KATIMKER" className="max-h-40 object-contain" />
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-8 flex items-center justify-center text-gray-400 text-sm">
              Belum ada spesimen TTD
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {hasSpesimen ? "Ganti spesimen" : "Upload spesimen"}
          </p>
          <p className="text-xs text-gray-400 mb-3">Format PNG, transparan background direkomendasikan</p>
          <label className="block">
            <input
              ref={inputRef}
              type="file"
              accept="image/png"
              disabled={uploading}
              onChange={handleUpload}
              className="block w-full text-sm text-gray-600
                file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-medium file:bg-green-600 file:text-white
                hover:file:bg-green-700 file:cursor-pointer file:transition
                disabled:opacity-50"
            />
          </label>
          {uploading && <p className="text-xs text-gray-500 mt-2">Menyimpan...</p>}
          {msg && (
            <p className={`text-xs mt-2 ${msg.ok ? "text-green-600" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
