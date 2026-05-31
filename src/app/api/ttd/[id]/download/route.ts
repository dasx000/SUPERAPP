import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });

  if (!doc || doc.status !== "DISETUJUI" || !doc.resultPath)
    return NextResponse.json({ error: "File tidak tersedia" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
  if (!isAdmin && doc.uploaderId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const buffer = await readFile(doc.resultPath);
  const filename = `TTD_${path.basename(doc.filename)}`;

  await prisma.auditLog.create({
    data: { action: "DOWNLOAD", userId: session.user.id, documentId: id },
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
