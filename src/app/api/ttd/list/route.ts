import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";

  const docs = await prisma.document.findMany({
    where: isAdmin ? {} : { uploaderId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      status: true,
      rejectReason: true,
      createdAt: true,
      uploader: { select: { name: true } },
    },
  });

  return NextResponse.json(docs);
}
