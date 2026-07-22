import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditLeaveForm } from "./edit-form";

export default async function EditLeaveRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { leaveType: true, user: { select: { name: true, email: true, department: true } } },
  });

  if (!request) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Edit leave request</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {request.user.name}
        {request.user.department ? ` — ${request.user.department}` : ""}
      </p>

      <EditLeaveForm
        id={request.id}
        userId={request.userId}
        initial={{
          leaveTypeId: request.leaveTypeId,
          startDate: request.startDate.toISOString().slice(0, 10),
          endDate: request.endDate.toISOString().slice(0, 10),
          reason: request.reason,
          projectId: request.projectId ?? "",
        }}
      />
    </div>
  );
}
