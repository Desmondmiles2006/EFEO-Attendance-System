import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { project: { name: "asc" } },
  });

  return NextResponse.json({ projects: memberships.map((m) => m.project) });
}
