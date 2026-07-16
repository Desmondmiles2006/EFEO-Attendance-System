import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { buildLeaveBalanceSummaryWorkbook } from "@/lib/exports";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const workbook = await buildLeaveBalanceSummaryWorkbook(year);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="efeo-leave-balances-${year}.xlsx"`,
    },
  });
}
