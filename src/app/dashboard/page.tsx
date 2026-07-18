import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBalances } from "@/lib/balance";
import { StatusBadge } from "@/components/status-badge";
import { QuotaCard } from "@/components/quota-card";
import { cardClass, primaryButtonClass } from "@/lib/styles";

export default async function DashboardOverview() {
  const session = await auth();
  const userId = session!.user.id;
  const year = new Date().getFullYear();

  const [balances, recent] = await Promise.all([
    getUserBalances(userId, year),
    prisma.leaveRequest.findMany({
      where: { userId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Overview</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your leave balances for {year}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {balances.map((b) => (
          <QuotaCard key={b.group} group={b.group} used={b.used} quota={b.quota} remaining={b.remaining} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Recent requests</h2>
        <Link href="/dashboard/leave/new" className={primaryButtonClass}>
          + Submit new request
        </Link>
      </div>

      <div className={`overflow-hidden ${cardClass}`}>
        <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Dates</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {recent.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-text-faint)]">
                  No requests yet.
                </td>
              </tr>
            )}
            {recent.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--color-surface-muted)]">
                <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">
                  {r.leaveType.code}{" "}
                  <span className="font-normal text-[var(--color-text-faint)]">— {r.leaveType.name}</span>
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">
                  {r.startDate.toDateString() === r.endDate.toDateString()
                    ? r.startDate.toLocaleDateString()
                    : `${r.startDate.toLocaleDateString()} – ${r.endDate.toLocaleDateString()}`}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
