import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!file.name.endsWith(".pdf"))
    return NextResponse.json({ error: "Hanya file PDF yang diizinkan" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "uploads", "originals");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const doc = await prisma.document.create({
    data: {
      filename: file.name,
      originalPath: filepath,
      uploaderId: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPLOAD",
      userId: session.user.id,
      documentId: doc.id,
    },
  });

  return NextResponse.json({ id: doc.id, filename: doc.filename }, { status: 201 });
}
