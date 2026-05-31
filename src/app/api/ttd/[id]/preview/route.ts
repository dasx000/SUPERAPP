import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

const PREVIEW_DIR = path.join(process.cwd(), "uploads", "previews");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
  const isOwner = doc.uploaderId === session.user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const previewPath = path.join(PREVIEW_DIR, `${id}_preview.pdf`);

  try {
    const buffer = await readFile(previewPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview_${doc.filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Preview belum tersedia" }, { status: 404 });
  }
}
