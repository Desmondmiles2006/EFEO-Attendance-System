import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOverview() {
  const [pendingMembers, pendingRequests, activeMembers] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  const cards = [
    { label: "Active members", value: activeMembers, href: "/admin/members" },
    { label: "Pending account approvals", value: pendingMembers, href: "/admin/members?status=PENDING" },
    { label: "Pending leave requests", value: pendingRequests, href: "/admin/requests" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admin overview</h1>
        <p className="mt-1 text-sm text-slate-500">EFEO institute-wide attendance summary</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
