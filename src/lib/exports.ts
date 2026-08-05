import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { daysInclusive } from "@/lib/balance";
import { ANNUAL_QUOTAS } from "@/lib/quotas";

function argb(hex: string) {
  return "FF" + hex.replace("#", "").toUpperCase();
}

function contrastFont(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "FF000000" : "FFFFFFFF";
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  });
}

export async function buildMemberRecordWorkbook(userId: string, year: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Member not found");

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId,
      startDate: { gte: new Date(year, 0, 1) },
      endDate: { lte: new Date(year, 11, 31, 23, 59, 59) },
    },
    include: { leaveType: true, reviewedBy: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${user.name} ${year}`);

  sheet.addRow(["Member", user.name]);
  sheet.addRow(["Email", user.email]);
  sheet.addRow(["Department", user.department ?? ""]);
  sheet.addRow(["Employee ID", user.employeeId ?? ""]);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "Code",
    "Leave Type",
    "Project",
    "Start Date",
    "End Date",
    "Days",
    "Reason",
    "Status",
    "Reviewed By",
    "Review Note",
  ]);
  styleHeaderRow(headerRow);

  for (const r of requests) {
    sheet.addRow([
      r.leaveType.code,
      r.leaveType.name,
      r.project?.name ?? "",
      r.startDate.toLocaleDateString(),
      r.endDate.toLocaleDateString(),
      daysInclusive(r.startDate, r.endDate) * r.leaveType.quotaWeight,
      r.reason,
      r.status,
      r.reviewedBy?.name ?? "",
      r.reviewNote ?? "",
    ]);
  }

  sheet.columns.forEach((col) => (col.width = 18));
  sheet.getColumn(7).width = 35;
  sheet.getColumn(10).width = 30;

  return workbook;
}

export async function buildInstituteReportWorkbook(
  year: number,
  from?: Date,
  to?: Date,
  status: "APPROVED" | "ALL" = "APPROVED"
) {
  const rangeStart = from ?? new Date(year, 0, 1);
  const rangeEnd = to ?? new Date(year, 11, 31, 23, 59, 59);

  const requests = await prisma.leaveRequest.findMany({
    where: {
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
      ...(status === "APPROVED" ? { status: "APPROVED" } : {}),
    },
    include: {
      leaveType: true,
      user: { select: { name: true, email: true, department: true, employeeId: true } },
      project: { select: { name: true } },
    },
    orderBy: [{ user: { name: "asc" } }, { startDate: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Institute Report");

  const headerRow = sheet.addRow([
    "Member",
    "Email",
    "Department",
    "Employee ID",
    "Code",
    "Leave Type",
    "Project",
    "Start Date",
    "End Date",
    "Days",
    "Reason",
    "Status",
  ]);
  styleHeaderRow(headerRow);

  for (const r of requests) {
    sheet.addRow([
      r.user.name,
      r.user.email,
      r.user.department ?? "",
      r.user.employeeId ?? "",
      r.leaveType.code,
      r.leaveType.name,
      r.project?.name ?? "",
      r.startDate.toLocaleDateString(),
      r.endDate.toLocaleDateString(),
      daysInclusive(r.startDate, r.endDate) * r.leaveType.quotaWeight,
      r.reason,
      r.status,
    ]);
  }

  sheet.columns.forEach((col) => (col.width = 16));
  sheet.getColumn(11).width = 35;

  return workbook;
}

export async function buildLeaveBalanceSummaryWorkbook(year: number) {
  const members = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const approved = await prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
    },
    include: { leaveType: true },
  });

  const groups = Object.keys(ANNUAL_QUOTAS);
  const usedByUserGroup: Record<string, Record<string, number>> = {};
  const compByUser: Record<string, { earned: number; taken: number }> = {};

  for (const r of approved) {
    const group = r.leaveType.quotaGroup;
    if (!group) continue;
    const start = r.startDate < yearStart ? yearStart : r.startDate;
    const end = r.endDate > yearEnd ? yearEnd : r.endDate;
    const days = daysInclusive(start, end) * r.leaveType.quotaWeight;

    if (group === "COMP") {
      compByUser[r.userId] ??= { earned: 0, taken: 0 };
      if (r.leaveType.code === "Co+") compByUser[r.userId].earned += days;
      else compByUser[r.userId].taken += days;
      continue;
    }

    usedByUserGroup[r.userId] ??= {};
    usedByUserGroup[r.userId][group] = (usedByUserGroup[r.userId][group] ?? 0) + days;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Leave Balances ${year}`);

  const columns = ["Member", "Email", "Department"];
  for (const g of groups) {
    columns.push(`${g} Used`, `${g} Quota`, `${g} Remaining`);
  }
  columns.push("COMP Taken", "COMP Earned", "COMP Remaining");
  const headerRow = sheet.addRow(columns);
  styleHeaderRow(headerRow);

  for (const m of members) {
    const row: (string | number)[] = [m.name, m.email, m.department ?? ""];
    for (const g of groups) {
      const used = usedByUserGroup[m.id]?.[g] ?? 0;
      const quota = ANNUAL_QUOTAS[g];
      row.push(used, quota, quota - used);
    }
    const comp = compByUser[m.id] ?? { earned: 0, taken: 0 };
    row.push(comp.taken, comp.earned, comp.earned - comp.taken);
    sheet.addRow(row);
  }

  sheet.columns.forEach((col) => (col.width = 14));
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 28;

  return workbook;
}

export async function buildMonthlyAttendanceSheetWorkbook(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth, 23, 59, 59);

  const [members, leaveTypes, requests] = await Promise.all([
    prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.leaveType.findMany(),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      include: { leaveType: true },
    }),
  ]);

  const leaveTypeByCode = new Map(leaveTypes.map((lt) => [lt.code, lt]));
  const presentType = leaveTypeByCode.get("Pre");

  const workbook = new ExcelJS.Workbook();
  const monthName = monthStart.toLocaleString("en-US", { month: "long" });
  const sheet = workbook.addWorksheet(`${monthName} ${year}`);

  const headerRow = sheet.addRow(["Member", ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]);
  styleHeaderRow(headerRow);
  sheet.getColumn(1).width = 24;
  for (let d = 2; d <= daysInMonth + 1; d++) sheet.getColumn(d).width = 5;

  for (const member of members) {
    const memberRequests = requests.filter((r) => r.userId === member.id);
    const row = sheet.addRow([member.name]);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const match = memberRequests.find((r) => r.startDate <= date && r.endDate >= date);
      const leaveType = match?.leaveType ?? presentType;
      const cell = row.getCell(day + 1);
      cell.value = leaveType?.code ?? "";
      cell.alignment = { horizontal: "center" };
      if (leaveType && leaveType.code !== "Pre") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(leaveType.color) } };
        cell.font = { color: { argb: contrastFont(leaveType.color) } };
      }
    }
  }

  const legendSheet = workbook.addWorksheet("Legend");
  const legendHeader = legendSheet.addRow(["Code", "Absence Type"]);
  styleHeaderRow(legendHeader);
  for (const lt of leaveTypes.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const row = legendSheet.addRow([lt.code, lt.name]);
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(lt.color) } };
    row.getCell(1).font = { color: { argb: contrastFont(lt.color) } };
  }
  legendSheet.getColumn(1).width = 10;
  legendSheet.getColumn(2).width = 32;

  return workbook;
}

// ---- Per-project exports ----

async function loadProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
  if (!project) throw new Error("Project not found");
  return project;
}

function safeSheetName(name: string) {
  // Excel sheet names max 31 chars and disallow : \ / ? * [ ]
  return name.replace(/[:\\/?*[\]]/g, " ").slice(0, 28);
}

/** Report: leave tagged to this project (approved) for the year, one row each. */
export async function buildProjectReportWorkbook(projectId: string, year: number) {
  const project = await loadProject(projectId);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const requests = await prisma.leaveRequest.findMany({
    where: {
      projectId,
      status: "APPROVED",
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
    },
    include: {
      leaveType: true,
      user: { select: { name: true, email: true, department: true, employeeId: true } },
    },
    orderBy: [{ user: { name: "asc" } }, { startDate: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(safeSheetName(project.name));

  const headerRow = sheet.addRow([
    "Member",
    "Email",
    "Department",
    "Employee ID",
    "Code",
    "Leave Type",
    "Start Date",
    "End Date",
    "Days",
    "Reason",
    "Status",
  ]);
  styleHeaderRow(headerRow);

  for (const r of requests) {
    sheet.addRow([
      r.user.name,
      r.user.email,
      r.user.department ?? "",
      r.user.employeeId ?? "",
      r.leaveType.code,
      r.leaveType.name,
      r.startDate.toLocaleDateString(),
      r.endDate.toLocaleDateString(),
      daysInclusive(r.startDate, r.endDate) * r.leaveType.quotaWeight,
      r.reason,
      r.status,
    ]);
  }

  sheet.columns.forEach((col) => (col.width = 16));
  sheet.getColumn(10).width = 35;

  return { workbook, project };
}

/** Monthly calendar for this project's members, showing leave tagged to this project. */
export async function buildProjectMonthlyWorkbook(projectId: string, year: number, month: number) {
  const project = await loadProject(projectId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth, 23, 59, 59);

  const [leaveTypes, requests] = await Promise.all([
    prisma.leaveType.findMany(),
    prisma.leaveRequest.findMany({
      where: {
        projectId,
        status: "APPROVED",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      include: { leaveType: true },
    }),
  ]);

  const presentType = leaveTypes.find((lt) => lt.code === "Pre");

  const workbook = new ExcelJS.Workbook();
  const monthName = monthStart.toLocaleString("en-US", { month: "long" });
  const sheet = workbook.addWorksheet(safeSheetName(`${monthName} ${year}`));

  const headerRow = sheet.addRow(["Member", ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]);
  styleHeaderRow(headerRow);
  sheet.getColumn(1).width = 24;
  for (let d = 2; d <= daysInMonth + 1; d++) sheet.getColumn(d).width = 5;

  for (const pm of project.members) {
    const member = pm.user;
    const memberRequests = requests.filter((r) => r.userId === member.id);
    const row = sheet.addRow([member.name]);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const match = memberRequests.find((r) => r.startDate <= date && r.endDate >= date);
      const leaveType = match?.leaveType ?? presentType;
      const cell = row.getCell(day + 1);
      cell.value = leaveType?.code ?? "";
      cell.alignment = { horizontal: "center" };
      if (leaveType && leaveType.code !== "Pre") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(leaveType.color) } };
        cell.font = { color: { argb: contrastFont(leaveType.color) } };
      }
    }
  }

  const legendSheet = workbook.addWorksheet("Legend");
  const legendHeader = legendSheet.addRow(["Code", "Absence Type"]);
  styleHeaderRow(legendHeader);
  for (const lt of leaveTypes.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const row = legendSheet.addRow([lt.code, lt.name]);
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(lt.color) } };
    row.getCell(1).font = { color: { argb: contrastFont(lt.color) } };
  }
  legendSheet.getColumn(1).width = 10;
  legendSheet.getColumn(2).width = 32;

  return { workbook, project };
}

/**
 * Balance summary for this project's members. Balances are full institute-wide yearly
 * quota usage (all their approved leave), since quotas are per-person, not per-project.
 */
export async function buildProjectBalanceWorkbook(projectId: string, year: number) {
  const project = await loadProject(projectId);
  const memberIds = project.members.map((m) => m.userId);

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const approved = await prisma.leaveRequest.findMany({
    where: {
      userId: { in: memberIds },
      status: "APPROVED",
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
    },
    include: { leaveType: true },
  });

  const groups = Object.keys(ANNUAL_QUOTAS);
  const usedByUserGroup: Record<string, Record<string, number>> = {};
  const compByUser: Record<string, { earned: number; taken: number }> = {};

  for (const r of approved) {
    const group = r.leaveType.quotaGroup;
    if (!group) continue;
    const start = r.startDate < yearStart ? yearStart : r.startDate;
    const end = r.endDate > yearEnd ? yearEnd : r.endDate;
    const days = daysInclusive(start, end) * r.leaveType.quotaWeight;

    if (group === "COMP") {
      compByUser[r.userId] ??= { earned: 0, taken: 0 };
      if (r.leaveType.code === "Co+") compByUser[r.userId].earned += days;
      else compByUser[r.userId].taken += days;
      continue;
    }
    usedByUserGroup[r.userId] ??= {};
    usedByUserGroup[r.userId][group] = (usedByUserGroup[r.userId][group] ?? 0) + days;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(safeSheetName(`Balances ${year}`));

  const columns = ["Member", "Email", "Department"];
  for (const g of groups) columns.push(`${g} Used`, `${g} Quota`, `${g} Remaining`);
  columns.push("COMP Taken", "COMP Earned", "COMP Remaining");
  const headerRow = sheet.addRow(columns);
  styleHeaderRow(headerRow);

  for (const pm of project.members) {
    const m = pm.user;
    const row: (string | number)[] = [m.name, m.email, m.department ?? ""];
    for (const g of groups) {
      const used = usedByUserGroup[m.id]?.[g] ?? 0;
      const quota = ANNUAL_QUOTAS[g];
      row.push(used, quota, quota - used);
    }
    const comp = compByUser[m.id] ?? { earned: 0, taken: 0 };
    row.push(comp.taken, comp.earned, comp.earned - comp.taken);
    sheet.addRow(row);
  }

  sheet.columns.forEach((col) => (col.width = 14));
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 28;

  return { workbook, project };
}
