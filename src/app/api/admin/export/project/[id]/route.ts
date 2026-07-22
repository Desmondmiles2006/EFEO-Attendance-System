import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import {
  buildProjectReportWorkbook,
  buildProjectMonthlyWorkbook,
  buildProjectBalanceWorkbook,
} from "@/lib/exports";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "report";
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  try {
    let result: { workbook: import("exceljs").Workbook; project: { name: string } };
    let filename: string;

    if (type === "monthly") {
      result = await buildProjectMonthlyWorkbook(id, year, month);
      filename = `efeo-${slug(result.project.name)}-monthly-${year}-${String(month).padStart(2, "0")}.xlsx`;
    } else if (type === "balances") {
      result = await buildProjectBalanceWorkbook(id, year);
      filename = `efeo-${slug(result.project.name)}-balances-${year}.xlsx`;
    } else {
      result = await buildProjectReportWorkbook(id, year);
      filename = `efeo-${slug(result.project.name)}-report-${year}.xlsx`;
    }

    const buffer = await result.workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
