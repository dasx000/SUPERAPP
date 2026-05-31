import TtdUpload from "../TtdUpload";

export default function UploadPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Upload Dokumen</h1>
      <p className="text-gray-500 text-sm mb-6">
        Upload PDF dengan placeholder{" "}
        <code className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-xs font-mono">{"$(ttd_katimker)"}</code>
      </p>
      <TtdUpload />
    </div>
  );
}
