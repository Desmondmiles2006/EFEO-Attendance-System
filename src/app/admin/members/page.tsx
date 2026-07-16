import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MembersTable } from "./members-table";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const members = await prisma.user.findMany({
    where: status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Members</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/admin/members?status=${f.value}` : "/admin/members"}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                (status ?? "") === f.value
                  ? "bg-[var(--color-accent)] text-white"
                  : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <MembersTable members={members} />
    </div>
  );
}
