import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectDetail } from "./project-detail";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, department: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!project) notFound();

  const activeMembers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/projects" className="text-sm text-[var(--color-accent)] hover:underline">
        ← All projects
      </Link>

      <ProjectDetail
        project={{
          id: project.id,
          name: project.name,
          description: project.description ?? "",
          members: project.members.map((m) => m.user),
        }}
        allActiveMembers={activeMembers}
      />
    </div>
  );
}
