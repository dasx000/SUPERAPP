import TtdUpload from "../TtdUpload";

export default function UploadPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Upload Dokumen</h1>
      <p className="text-gray-500 text-sm mb-6">
        Upload PDF dengan placeholder <code className="bg-gray-100 px-1 rounded">{"$(ttd_bupati)"}</code>
      </p>
      <TtdUpload />
    </div>
  );
}
