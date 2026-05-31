import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!file.type.startsWith("image/png") && !file.name.endsWith(".png"))
    return NextResponse.json({ error: "Hanya file PNG yang diizinkan" }, { status: 400 });

  const spesimenDir = path.join(process.cwd(), "uploads", "spesimen");
  await mkdir(spesimenDir, { recursive: true });

  const filepath = path.join(spesimenDir, `${id}.png`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  await prisma.user.update({ where: { id }, data: { ttdPath: filepath } });

  return NextResponse.json({ message: "Spesimen TTD berhasil disimpan" });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { ttdPath: true } });
  if (!user?.ttdPath) return NextResponse.json({ error: "Belum ada spesimen" }, { status: 404 });

  try {
    const buffer = await readFile(user.ttdPath);
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }
}
