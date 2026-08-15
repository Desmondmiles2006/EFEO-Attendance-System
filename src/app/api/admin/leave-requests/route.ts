import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { adminAssignLeaveSchema } from "@/lib/validation";
import { computeQuotaWarning } from "@/lib/quota-warning";
import { isValidProjectForUser } from "@/lib/project-check";
import { sendLeaveDecisionEmail } from "@/lib/email";

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

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = adminAssignLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { userId, leaveTypeId, startDate, endDate, reason, projectId } = parsed.data;

  const [targetUser, leaveType] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.leaveType.findUnique({ where: { id: leaveTypeId } }),
  ]);

  if (!targetUser || targetUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Member not found or not active" }, { status: 400 });
  }
  if (!leaveType || !leaveType.selectable) {
    return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
  }
  if (!(await isValidProjectForUser(userId, projectId))) {
    return NextResponse.json({ error: "That member is not assigned to the selected project" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const created = await prisma.leaveRequest.create({
    data: {
      userId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      reason,
      projectId,
      status: "APPROVED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
    include: { leaveType: true, user: { select: { id: true, name: true, email: true, department: true } } },
  });

  const warning = await computeQuotaWarning(userId, leaveType, start);

  // Admin-assigned leave is approved on creation — let the member know.
  await sendLeaveDecisionEmail(
    created.user.email,
    {
      memberName: created.user.name,
      leaveCode: created.leaveType.code,
      leaveName: created.leaveType.name,
      startDate: created.startDate,
      endDate: created.endDate,
      reason: created.reason,
    },
    "APPROVED",
    null
  );

  return NextResponse.json({ request: created, warning });
}
