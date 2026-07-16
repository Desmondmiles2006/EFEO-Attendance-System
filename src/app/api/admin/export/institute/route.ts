import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { buildInstituteReportWorkbook } from "@/lib/exports";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  const status = searchParams.get("status") === "ALL" ? "ALL" : "APPROVED";

  const workbook = await buildInstituteReportWorkbook(year, from, to, status);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="efeo-institute-report-${year}.xlsx"`,
    },
  });
}
