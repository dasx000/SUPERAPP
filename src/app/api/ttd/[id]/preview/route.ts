import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });

  if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  if (!doc.originalPath) return NextResponse.json({ error: "File tidak tersedia" }, { status: 404 });

  try {
    const buffer = await readFile(doc.originalPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }
}
