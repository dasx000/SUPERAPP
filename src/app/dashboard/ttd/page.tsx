import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TtdPage() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  const [totalDocs, menunggu, disetujui, ditolak] = await Promise.all([
    prisma.document.count({ where: isAdmin ? {} : { uploaderId: userId } }),
    prisma.document.count({ where: { status: "MENUNGGU", ...(isAdmin ? {} : { uploaderId: userId }) } }),
    prisma.document.count({ where: { status: "DISETUJUI", ...(isAdmin ? {} : { uploaderId: userId }) } }),
    prisma.document.count({ where: { status: "DITOLAK", ...(isAdmin ? {} : { uploaderId: userId }) } }),
  ]);

  const stats = [
    { label: "Total Dokumen", value: totalDocs, color: "bg-blue-500" },
    { label: "Menunggu", value: menunggu, color: "bg-yellow-500" },
    { label: "Disetujui", value: disetujui, color: "bg-green-500" },
    { label: "Ditolak", value: ditolak, color: "bg-red-500" },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">TTD Dokumen</h1>
      <p className="text-gray-500 text-sm mb-6">Selamat datang, {session!.user.name}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className={`w-10 h-10 ${s.color} rounded-lg mb-3`} />
            <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
