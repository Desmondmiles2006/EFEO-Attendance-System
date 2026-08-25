import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

/** Lightweight feed of pending requests, polled by the admin desktop-notifier. */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.leaveRequest.findMany({
    where: { status: "PENDING" },
    include: { leaveType: { select: { code: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      member: r.user.name,
      code: r.leaveType.code,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
