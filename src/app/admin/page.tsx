import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardClass } from "@/lib/styles";

export default async function AdminOverview() {
  const [pendingMembers, pendingRequests, activeMembers, projects] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.project.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { members: true } } },
    }),
  ]);

  const cards = [
    { label: "Active members", value: activeMembers, href: "/admin/members", urgent: false },
    {
      label: "Pending account approvals",
      value: pendingMembers,
      href: "/admin/members?status=PENDING",
      urgent: pendingMembers > 0,
    },
    { label: "Pending leave requests", value: pendingRequests, href: "/admin/requests", urgent: pendingRequests > 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Admin overview</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">EFEO institute-wide attendance summary</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)] hover:shadow-sm"
          >
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{c.label}</p>
            <p
              className="mt-1 text-3xl font-semibold"
              style={{ color: c.urgent ? "var(--color-accent)" : "var(--color-text)" }}
            >
              {c.value}
            </p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Projects</h2>
          <Link href="/admin/projects" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
            Manage projects
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className={`mt-3 ${cardClass} p-4 text-sm text-[var(--color-text-faint)]`}>
            No projects yet.{" "}
            <Link href="/admin/projects" className="font-medium text-[var(--color-accent)] hover:underline">
              Create one
            </Link>
            .
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)] hover:shadow-sm"
              >
                <p className="font-medium text-[var(--color-text)]">{p.name}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {p._count.members} member{p._count.members === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
