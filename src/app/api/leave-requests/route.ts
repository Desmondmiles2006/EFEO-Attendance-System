import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveRequestSchema } from "@/lib/validation";
import { daysInclusive } from "@/lib/balance";
import { ANNUAL_QUOTAS } from "@/lib/quotas";

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

  let warning: string | null = null;
  if (leaveType.quotaGroup) {
    const quota = ANNUAL_QUOTAS[leaveType.quotaGroup];
    const year = start.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const approvedSameGroup = await prisma.leaveRequest.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { lte: yearEnd },
        endDate: { gte: yearStart },
        leaveType: { quotaGroup: leaveType.quotaGroup },
      },
      include: { leaveType: true },
    });

    const used = approvedSameGroup.reduce((sum, r) => {
      const s = r.startDate < yearStart ? yearStart : r.startDate;
      const e = r.endDate > yearEnd ? yearEnd : r.endDate;
      return sum + daysInclusive(s, e) * r.leaveType.quotaWeight;
    }, 0);

    if (used > quota) {
      warning = `This request puts your ${leaveType.quotaGroup} leave usage at ${used} day(s), above the ${quota}-day annual quota.`;
    }
  }

  return NextResponse.json({ request: created, warning });
}
