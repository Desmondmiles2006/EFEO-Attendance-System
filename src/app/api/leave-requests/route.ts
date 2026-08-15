import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveRequestSchema } from "@/lib/validation";
import { computeQuotaWarning } from "@/lib/quota-warning";
import { isValidProjectForUser } from "@/lib/project-check";
import { sendLeaveSubmittedEmail, sendAdminNewRequestEmail } from "@/lib/email";

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

  const { leaveTypeId, startDate, endDate, reason, projectId } = parsed.data;

  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType || !leaveType.selectable) {
    return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
  }

  if (!(await isValidProjectForUser(session.user.id, projectId))) {
    return NextResponse.json({ error: "You are not assigned to that project" }, { status: 400 });
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
      projectId,
      status: "PENDING",
    },
    include: { leaveType: true, user: { select: { name: true, email: true } } },
  });

  const warning = await computeQuotaWarning(session.user.id, leaveType, start);

  // Notify the member (under review) and all active admins (new request). Non-blocking on failure.
  const info = {
    memberName: created.user.name,
    leaveCode: created.leaveType.code,
    leaveName: created.leaveType.name,
    startDate: created.startDate,
    endDate: created.endDate,
    reason: created.reason,
  };
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true },
  });
  await Promise.allSettled([
    sendLeaveSubmittedEmail(created.user.email, info),
    sendAdminNewRequestEmail(admins.map((a) => a.email), info),
  ]);

  return NextResponse.json({ request: created, warning });
}
