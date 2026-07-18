import type { LeaveType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysInclusive, getCompBalance } from "@/lib/balance";
import { ANNUAL_QUOTAS } from "@/lib/quotas";

export async function computeQuotaWarning(
  userId: string,
  leaveType: LeaveType,
  start: Date
): Promise<string | null> {
  const year = start.getFullYear();

  if (leaveType.quotaGroup === "COMP") {
    const comp = await getCompBalance(userId, year, ["APPROVED", "PENDING"]);
    if (comp.taken > comp.earned) {
      return `This puts compensatory leave taken at ${comp.taken} day(s), above the ${comp.earned} day(s) earned this year.`;
    }
    return null;
  }

  if (!leaveType.quotaGroup || !(leaveType.quotaGroup in ANNUAL_QUOTAS)) return null;

  const quota = ANNUAL_QUOTAS[leaveType.quotaGroup];
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const sameGroup = await prisma.leaveRequest.findMany({
    where: {
      userId,
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
      leaveType: { quotaGroup: leaveType.quotaGroup },
    },
    include: { leaveType: true },
  });

  const used = sameGroup.reduce((sum, r) => {
    const s = r.startDate < yearStart ? yearStart : r.startDate;
    const e = r.endDate > yearEnd ? yearEnd : r.endDate;
    return sum + daysInclusive(s, e) * r.leaveType.quotaWeight;
  }, 0);

  if (used > quota) {
    return `This request puts ${leaveType.quotaGroup} leave usage at ${used} day(s), above the ${quota}-day annual quota.`;
  }
  return null;
}
