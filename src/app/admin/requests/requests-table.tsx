"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { cardClass, approveButtonClass, rejectButtonClass } from "@/lib/styles";

type Row = {
  id: string;
  status: string;
  reason: string;
  startDate: string;
  endDate: string;
  leaveType: { code: string; name: string };
  user: { name: string; email: string; department: string | null };
};

export function RequestsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  async function review(id: string, action: "APPROVE" | "REJECT") {
    setBusyId(id);
    await fetch(`/api/admin/leave-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNote: noteDrafts[id] ?? "" }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className={`overflow-hidden ${cardClass}`}>
      <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Member</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Type</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Dates</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Reason</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Status</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Note</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-text-faint)]">
                No requests found.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[var(--color-surface-muted)]">
              <td className="px-4 py-2.5">
                <div className="font-medium text-[var(--color-text)]">{r.user.name}</div>
                <div className="text-xs text-[var(--color-text-faint)]">{r.user.department ?? r.user.email}</div>
              </td>
              <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">{r.leaveType.code}</td>
              <td className="px-4 py-2.5 text-[var(--color-text-muted)]">
                {new Date(r.startDate).toDateString() === new Date(r.endDate).toDateString()
                  ? new Date(r.startDate).toLocaleDateString()
                  : `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}`}
              </td>
              <td className="max-w-[16rem] truncate px-4 py-2.5 text-[var(--color-text-muted)]" title={r.reason}>
                {r.reason}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-2.5">
                {r.status === "PENDING" ? (
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={noteDrafts[r.id] ?? ""}
                    onChange={(e) => setNoteDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    className="w-40 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                ) : (
                  <span className="text-xs text-[var(--color-text-faint)]">—</span>
                )}
              </td>
              <td className="space-x-2 px-4 py-2.5 text-right">
                {r.status === "PENDING" && (
                  <>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "APPROVE")}
                      className={approveButtonClass}
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "REJECT")}
                      className={rejectButtonClass}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
