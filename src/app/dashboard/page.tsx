import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBalances } from "@/lib/balance";
import { StatusBadge } from "@/components/status-badge";

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
        <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Your leave balances for {year}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balances.map((b) => {
          const over = b.remaining < 0;
          return (
            <div
              key={b.group}
              className={`rounded-lg border p-4 ${over ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
            >
              <p className="text-sm font-medium text-slate-500">{b.group}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {b.used} <span className="text-base font-normal text-slate-400">/ {b.quota} days</span>
              </p>
              <p className={`mt-1 text-xs ${over ? "text-red-600" : "text-slate-500"}`}>
                {over ? `${Math.abs(b.remaining)} day(s) over quota` : `${b.remaining} day(s) remaining`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent requests</h2>
        <Link href="/dashboard/leave/new" className="text-sm font-medium text-blue-600 hover:underline">
          + Submit new request
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Dates</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recent.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No requests yet.
                </td>
              </tr>
            )}
            {recent.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2">
                  {r.leaveType.code} <span className="text-slate-400">— {r.leaveType.name}</span>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {r.startDate.toDateString() === r.endDate.toDateString()
                    ? r.startDate.toLocaleDateString()
                    : `${r.startDate.toLocaleDateString()} – ${r.endDate.toLocaleDateString()}`}
                </td>
                <td className="px-4 py-2">
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
