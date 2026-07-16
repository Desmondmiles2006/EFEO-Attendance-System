import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, department, employeeId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  if (employeeId) {
    const existingEmployeeId = await prisma.user.findUnique({ where: { employeeId } });
    if (existingEmployeeId) {
      return NextResponse.json(
        { error: "This employee ID is already registered." },
        { status: 409 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      department: department || null,
      employeeId: employeeId || null,
      role: "MEMBER",
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true });
}
