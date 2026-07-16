"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  employeeId: string | null;
  role: "MEMBER" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-slate-200 text-slate-700",
};

export function MembersTable({ members }: { members: Member[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Email</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Department</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Employee ID</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                No members found.
              </td>
            </tr>
          )}
          {members.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-2 font-medium text-slate-900">{m.name}</td>
              <td className="px-4 py-2 text-slate-600">{m.email}</td>
              <td className="px-4 py-2 text-slate-600">{m.department ?? "—"}</td>
              <td className="px-4 py-2 text-slate-600">{m.employeeId ?? "—"}</td>
              <td className="px-4 py-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status]}`}>
                  {m.status}
                </span>
              </td>
              <td className="space-x-2 px-4 py-2 text-right">
                {m.status === "PENDING" && (
                  <>
                    <button
                      disabled={busyId === m.id}
                      onClick={() => updateStatus(m.id, "ACTIVE")}
                      className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === m.id}
                      onClick={() => updateStatus(m.id, "REJECTED")}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {m.status === "ACTIVE" && (
                  <button
                    disabled={busyId === m.id}
                    onClick={() => updateStatus(m.id, "SUSPENDED")}
                    className="text-xs font-medium text-slate-600 hover:underline disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
                {(m.status === "SUSPENDED" || m.status === "REJECTED") && (
                  <button
                    disabled={busyId === m.id}
                    onClick={() => updateStatus(m.id, "ACTIVE")}
                    className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
                  >
                    Reactivate
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
