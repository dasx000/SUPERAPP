import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stampPdf } from "@/lib/stamp";
import { access, unlink } from "fs/promises";
import path from "path";

const PREVIEW_DIR = path.join(process.cwd(), "uploads", "previews");

const SPESIMEN_PATH = path.join(process.cwd(), "uploads", "spesimen", "katimker.png");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  if (doc.status !== "MENUNGGU")
    return NextResponse.json({ error: "Dokumen sudah diproses" }, { status: 400 });

  try {
    await access(SPESIMEN_PATH);
  } catch {
    return NextResponse.json({ error: "Spesimen TTD KATIMKER belum diatur" }, { status: 400 });
  }

  try {
    await access(doc.originalPath);
  } catch {
    return NextResponse.json({ error: "File original tidak ditemukan, minta pengguna upload ulang" }, { status: 400 });
  }

  let resultPath: string;
  try {
    resultPath = await stampPdf(doc.originalPath, SPESIMEN_PATH, id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await unlink(doc.originalPath).catch(() => {});
  await unlink(path.join(PREVIEW_DIR, `${id}_preview.pdf`)).catch(() => {});

  await prisma.document.update({
    where: { id },
    data: { status: "DISETUJUI", resultPath, approvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { action: "APPROVE", userId: session.user.id, documentId: id },
  });

  return NextResponse.json({ message: "Dokumen disetujui", resultPath });
}
