import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, readFile, access } from "fs/promises";
import path from "path";

const SPESIMEN_PATH = path.join(process.cwd(), "uploads", "spesimen", "katimker.png");

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await access(SPESIMEN_PATH);
    const buffer = await readFile(SPESIMEN_PATH);
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Belum ada spesimen" }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!file.name.endsWith(".png"))
    return NextResponse.json({ error: "Hanya file PNG yang diizinkan" }, { status: 400 });

  await mkdir(path.dirname(SPESIMEN_PATH), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(SPESIMEN_PATH, buffer);

  return NextResponse.json({ message: "Spesimen TTD berhasil disimpan" });
}
