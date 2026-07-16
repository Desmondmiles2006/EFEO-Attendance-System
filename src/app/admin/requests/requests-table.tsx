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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Member</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Type</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Dates</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Reason</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Note</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                No requests found.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">
                <div className="font-medium text-slate-900">{r.user.name}</div>
                <div className="text-xs text-slate-500">{r.user.department ?? r.user.email}</div>
              </td>
              <td className="px-4 py-2">{r.leaveType.code}</td>
              <td className="px-4 py-2 text-slate-600">
                {new Date(r.startDate).toDateString() === new Date(r.endDate).toDateString()
                  ? new Date(r.startDate).toLocaleDateString()
                  : `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}`}
              </td>
              <td className="max-w-[16rem] truncate px-4 py-2 text-slate-600" title={r.reason}>
                {r.reason}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-2">
                {r.status === "PENDING" ? (
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={noteDrafts[r.id] ?? ""}
                    onChange={(e) => setNoteDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs"
                  />
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </td>
              <td className="space-x-2 px-4 py-2 text-right">
                {r.status === "PENDING" && (
                  <>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "APPROVE")}
                      className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "REJECT")}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
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
