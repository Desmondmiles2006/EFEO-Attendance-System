"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

type Row = {
  id: string;
  status: string;
  reason: string;
  startDate: string;
  endDate: string;
  leaveType: { code: string; name: string };
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Type</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Dates</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Reason</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                No requests this year.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">
                {r.leaveType.code} <span className="text-slate-400">— {r.leaveType.name}</span>
              </td>
              <td className="px-4 py-2 text-slate-600">
                {new Date(r.startDate).toDateString() === new Date(r.endDate).toDateString()
                  ? new Date(r.startDate).toLocaleDateString()
                  : `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}`}
              </td>
              <td className="max-w-xs truncate px-4 py-2 text-slate-600" title={r.reason}>
                {r.reason}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-2 text-right">
                {r.status === "PENDING" && (
                  <button
                    onClick={() => cancel(r.id)}
                    disabled={cancellingId === r.id}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
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
