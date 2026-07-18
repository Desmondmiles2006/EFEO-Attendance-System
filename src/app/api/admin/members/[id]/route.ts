import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED", "SUSPENDED"]).optional(),
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.status && !parsed.data.role)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (id === session.user.id && parsed.data.role === "MEMBER") {
    return NextResponse.json({ error: "You cannot demote your own account" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
