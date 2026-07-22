import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { reviewSchema, leaveRequestSchema } from "@/lib/validation";
import { computeQuotaWarning } from "@/lib/quota-warning";
import { isValidProjectForUser } from "@/lib/project-check";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { leaveType: true, user: { select: { id: true, name: true, email: true, department: true } } },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ request });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "This request has already been reviewed" }, { status: 400 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: parsed.data.reviewNote || null,
    },
  });

  return NextResponse.json({ request: updated });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = leaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leaveType = await prisma.leaveType.findUnique({ where: { id: parsed.data.leaveTypeId } });
  if (!leaveType || !leaveType.selectable) {
    return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
  }
  if (!(await isValidProjectForUser(existing.userId, parsed.data.projectId))) {
    return NextResponse.json({ error: "That member is not assigned to the selected project" }, { status: 400 });
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      leaveTypeId: parsed.data.leaveTypeId,
      startDate: start,
      endDate: end,
      reason: parsed.data.reason,
      projectId: parsed.data.projectId,
    },
    include: { leaveType: true, user: { select: { id: true, name: true, email: true, department: true } } },
  });

  const warning =
    existing.status === "APPROVED" ? await computeQuotaWarning(existing.userId, leaveType, start) : null;

  return NextResponse.json({ request: updated, warning });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.leaveRequest.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
