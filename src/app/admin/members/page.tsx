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
        <h1 className="text-xl font-semibold text-slate-900">Members</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/admin/members?status=${f.value}` : "/admin/members"}
              className={`rounded-md px-3 py-1.5 text-sm ${
                (status ?? "") === f.value
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"
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
