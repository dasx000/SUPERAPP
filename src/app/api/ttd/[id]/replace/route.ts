import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stampPreview } from "@/lib/stamp";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const PREVIEW_DIR = path.join(process.cwd(), "uploads", "previews");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });

  if (doc.uploaderId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (doc.status !== "MENUNGGU" && doc.status !== "DITOLAK")
    return NextResponse.json({ error: "Dokumen tidak dapat diganti" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!file.name.endsWith(".pdf"))
    return NextResponse.json({ error: "Hanya file PDF yang diizinkan" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "uploads", "originals");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${file.name.replace(/\s/g, "_")}-${Date.now()}.pdf`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

  if (doc.originalPath) await unlink(doc.originalPath).catch(() => {});
  await unlink(path.join(PREVIEW_DIR, `${id}_preview.pdf`)).catch(() => {});

  await prisma.document.update({
    where: { id },
    data: { filename: file.name, originalPath: filepath, status: "MENUNGGU" },
  });

  await prisma.auditLog.create({
    data: { action: "UPLOAD", userId: session.user.id, documentId: id },
  });

  stampPreview(filepath, id).catch(() => {});

  return NextResponse.json({ message: "File berhasil diganti" });
}
