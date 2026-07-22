import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, department: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      members: project.members.map((m) => m.user),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const clash = await prisma.project.findFirst({
    where: { name: parsed.data.name, NOT: { id } },
  });
  if (clash) {
    return NextResponse.json({ error: "A project with this name already exists." }, { status: 409 });
  }

  const project = await prisma.project.update({
    where: { id },
    data: { name: parsed.data.name, description: parsed.data.description || null },
  });

  return NextResponse.json({ project });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Members detach via ProjectMember cascade; any leave tagged to this project is untagged (projectId -> null).
  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
