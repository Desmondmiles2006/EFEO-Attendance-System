import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const memberships = await prisma.projectMember.findMany({
    where: { userId: id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { project: { name: "asc" } },
  });

  return NextResponse.json({ projects: memberships.map((m) => m.project) });
}
