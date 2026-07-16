import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const members = await prisma.user.findMany({
    where: status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      employeeId: true,
      role: true,
      status: true,
      joinDate: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ members });
}
