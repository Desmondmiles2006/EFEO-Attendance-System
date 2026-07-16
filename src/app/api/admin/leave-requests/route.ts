import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const requests = await prisma.leaveRequest.findMany({
    where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" } : undefined,
    include: { leaveType: true, user: { select: { id: true, name: true, email: true, department: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
