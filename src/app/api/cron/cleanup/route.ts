import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const expired = await prisma.document.findMany({
    where: {
      status: "DISETUJUI",
      approvedAt: { lte: cutoff },
      resultPath: { not: null },
    },
    select: { id: true, resultPath: true },
  });

  let deleted = 0;
  for (const doc of expired) {
    await unlink(doc.resultPath!).catch(() => {});
    await prisma.document.update({
      where: { id: doc.id },
      data: { resultPath: null },
    });
    deleted++;
  }

  return NextResponse.json({ deleted, checked: expired.length });
}
