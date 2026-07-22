import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { projectMemberSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = projectMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: parsed.data.userId } }),
  ]);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Member not found or not active" }, { status: 400 });
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: id, userId: parsed.data.userId } },
    update: {},
    create: { projectId: id, userId: parsed.data.userId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  await prisma.projectMember.deleteMany({ where: { projectId: id, userId } });

  return NextResponse.json({ ok: true });
}
