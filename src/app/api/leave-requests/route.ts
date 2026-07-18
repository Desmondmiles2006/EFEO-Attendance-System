import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveRequestSchema } from "@/lib/validation";
import { computeQuotaWarning } from "@/lib/quota-warning";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId: session.user.id,
      startDate: { gte: new Date(year, 0, 1) },
      endDate: { lte: new Date(year, 11, 31, 23, 59, 59) },
    },
    include: { leaveType: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = leaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { leaveTypeId, startDate, endDate, reason } = parsed.data;

  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType || !leaveType.selectable) {
    return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const created = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      leaveTypeId,
      startDate: start,
      endDate: end,
      reason,
      status: "PENDING",
    },
    include: { leaveType: true },
  });

  const warning = await computeQuotaWarning(session.user.id, leaveType, start);

  return NextResponse.json({ request: created, warning });
}
