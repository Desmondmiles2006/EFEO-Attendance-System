import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RequestsTable } from "./requests-table";

const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "" },
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";

  const requests = await prisma.leaveRequest.findMany({
    where: activeStatus ? { status: activeStatus as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" } : undefined,
    include: {
      leaveType: true,
      user: { select: { name: true, email: true, department: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Leave requests</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/admin/requests?status=${f.value}` : "/admin/requests?status="}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeStatus === f.value
                  ? "bg-[var(--color-accent)] text-white"
                  : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <RequestsTable
        rows={requests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          leaveType: { code: r.leaveType.code, name: r.leaveType.name },
          user: r.user,
          projectName: r.project?.name ?? null,
        }))}
      />
    </div>
  );
}
