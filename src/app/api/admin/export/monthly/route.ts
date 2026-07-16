import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { buildMonthlyAttendanceSheetWorkbook } from "@/lib/exports";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  const workbook = await buildMonthlyAttendanceSheetWorkbook(year, month);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="efeo-monthly-attendance-${year}-${String(month).padStart(2, "0")}.xlsx"`,
    },
  });
}
