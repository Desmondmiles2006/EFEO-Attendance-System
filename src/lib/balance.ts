import { differenceInCalendarDays, endOfYear, startOfYear } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ANNUAL_QUOTAS } from "@/lib/quotas";

export function daysInclusive(start: Date, end: Date) {
  return differenceInCalendarDays(end, start) + 1;
}

export type QuotaBalance = {
  group: string;
  quota: number;
  used: number;
  remaining: number;
};

export async function getUserBalances(userId: string, year: number): Promise<QuotaBalance[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId,
      status: "APPROVED",
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
    },
    include: { leaveType: true },
  });

  const usedByGroup: Record<string, number> = {};
  for (const req of requests) {
    const group = req.leaveType.quotaGroup;
    if (!group) continue;
    const start = req.startDate < yearStart ? yearStart : req.startDate;
    const end = req.endDate > yearEnd ? yearEnd : req.endDate;
    const days = daysInclusive(start, end) * req.leaveType.quotaWeight;
    usedByGroup[group] = (usedByGroup[group] ?? 0) + days;
  }

  return Object.entries(ANNUAL_QUOTAS).map(([group, quota]) => ({
    group,
    quota,
    used: usedByGroup[group] ?? 0,
    remaining: quota - (usedByGroup[group] ?? 0),
  }));
}
