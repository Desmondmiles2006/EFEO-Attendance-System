import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HistoryTable } from "./history-table";
import { YearSelect } from "./year-select";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId: session!.user.id,
      startDate: { gte: new Date(year, 0, 1) },
      endDate: { lte: new Date(year, 11, 31, 23, 59, 59) },
    },
    include: { leaveType: true },
    orderBy: { createdAt: "desc" },
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">My history</h1>
        <YearSelect year={year} years={years} />
      </div>

      <HistoryTable
        rows={requests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          leaveType: { code: r.leaveType.code, name: r.leaveType.name },
        }))}
      />
    </div>
  );
}
