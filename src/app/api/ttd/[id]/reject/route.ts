import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { reason } = await req.json();

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  if (doc.status !== "MENUNGGU")
    return NextResponse.json({ error: "Dokumen sudah diproses" }, { status: 400 });

  await prisma.document.update({
    where: { id },
    data: { status: "DITOLAK", rejectReason: reason ?? "Tidak ada alasan" },
  });

  await prisma.auditLog.create({
    data: { action: "REJECT", userId: session.user.id, documentId: id },
  });

  return NextResponse.json({ message: "Dokumen ditolak" });
}
