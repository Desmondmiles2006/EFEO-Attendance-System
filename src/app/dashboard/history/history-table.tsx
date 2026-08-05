"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { cardClass, rejectButtonClass } from "@/lib/styles";

type Row = {
  id: string;
  status: string;
  reason: string;
  startDate: string;
  endDate: string;
  leaveType: { code: string; name: string };
  projectName: string | null;
};

export function HistoryTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function cancel(id: string) {
    setCancellingId(id);
    await fetch(`/api/leave-requests/${id}`, { method: "DELETE" });
    setCancellingId(null);
    router.refresh();
  }

  return (
    <div className={`overflow-hidden ${cardClass}`}>
      <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Type</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Project</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Dates</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Reason</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-text-faint)]">
                No requests this year.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[var(--color-surface-muted)]">
              <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">
                {r.leaveType.code}{" "}
                <span className="font-normal text-[var(--color-text-faint)]">— {r.leaveType.name}</span>
              </td>
              <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{r.projectName ?? "—"}</td>
              <td className="px-4 py-2.5 text-[var(--color-text-muted)]">
                {new Date(r.startDate).toDateString() === new Date(r.endDate).toDateString()
                  ? new Date(r.startDate).toLocaleDateString()
                  : `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}`}
              </td>
              <td className="max-w-xs truncate px-4 py-2.5 text-[var(--color-text-muted)]" title={r.reason}>
                {r.reason}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-2.5 text-right">
                {r.status === "PENDING" && (
                  <button
                    onClick={() => cancel(r.id)}
                    disabled={cancellingId === r.id}
                    className={rejectButtonClass}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
