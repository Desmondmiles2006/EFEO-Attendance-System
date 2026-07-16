import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { buildMemberRecordWorkbook } from "@/lib/exports";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  try {
    const workbook = await buildMemberRecordWorkbook(id, year);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="efeo-member-${id}-${year}.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
}
