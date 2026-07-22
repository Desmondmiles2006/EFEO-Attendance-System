import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardClass } from "@/lib/styles";
import { CreateProjectForm } from "./create-form";
import { DeleteProjectButton } from "./delete-button";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Projects</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Group members into projects, then export each project&apos;s attendance separately.
        </p>
      </div>

      <CreateProjectForm />

      <div className={`overflow-hidden ${cardClass}`}>
        <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Project</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Description</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Members</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-faint)]">
                  No projects yet. Create one above.
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--color-surface-muted)]">
                <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">
                  <Link href={`/admin/projects/${p.id}`} className="text-[var(--color-accent)] hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p.description ?? "—"}</td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p._count.members}</td>
                <td className="space-x-3 px-4 py-2.5 text-right whitespace-nowrap">
                  <Link href={`/admin/projects/${p.id}`} className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
                    Manage
                  </Link>
                  <DeleteProjectButton id={p.id} name={p.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
