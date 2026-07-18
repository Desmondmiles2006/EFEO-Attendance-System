import { differenceInCalendarDays, endOfYear, startOfYear } from "date-fns";
import type { RequestStatus } from "@prisma/client";
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

export async function getCompBalance(
  userId: string,
  year: number,
  statuses: RequestStatus[] = ["APPROVED"]
): Promise<{ earned: number; taken: number }> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId,
      status: { in: statuses },
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
      leaveType: { quotaGroup: "COMP" },
    },
    include: { leaveType: true },
  });

  let earned = 0;
  let taken = 0;
  for (const r of requests) {
    const start = r.startDate < yearStart ? yearStart : r.startDate;
    const end = r.endDate > yearEnd ? yearEnd : r.endDate;
    const days = daysInclusive(start, end) * r.leaveType.quotaWeight;
    if (r.leaveType.code === "Co+") earned += days;
    else taken += days;
  }

  return { earned, taken };
}

export async function getUserBalances(userId: string, year: number): Promise<QuotaBalance[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const [requests, comp] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        userId,
        status: "APPROVED",
        startDate: { lte: yearEnd },
        endDate: { gte: yearStart },
      },
      include: { leaveType: true },
    }),
    getCompBalance(userId, year),
  ]);

  const usedByGroup: Record<string, number> = {};
  for (const req of requests) {
    const group = req.leaveType.quotaGroup;
    if (!group || group === "COMP") continue;
    const start = req.startDate < yearStart ? yearStart : req.startDate;
    const end = req.endDate > yearEnd ? yearEnd : req.endDate;
    const days = daysInclusive(start, end) * req.leaveType.quotaWeight;
    usedByGroup[group] = (usedByGroup[group] ?? 0) + days;
  }

  const fixedGroups = Object.entries(ANNUAL_QUOTAS).map(([group, quota]) => ({
    group,
    quota,
    used: usedByGroup[group] ?? 0,
    remaining: quota - (usedByGroup[group] ?? 0),
  }));

  return [
    ...fixedGroups,
    {
      group: "COMP",
      quota: comp.earned,
      used: comp.taken,
      remaining: comp.earned - comp.taken,
    },
  ];
}
