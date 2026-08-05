"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cardClass, approveButtonClass, rejectButtonClass, neutralButtonClass, dangerLinkClass } from "@/lib/styles";

type Member = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  employeeId: string | null;
  role: "MEMBER" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  projects: string[];
};

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "var(--color-warning)" },
  ACTIVE: { bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-success)" },
  REJECTED: { bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "var(--color-danger)" },
  SUSPENDED: { bg: "var(--color-neutral-bg)", border: "var(--color-neutral-border)", text: "var(--color-neutral)" },
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

  async function deleteMember(id: string, name: string) {
    if (
      !window.confirm(
        `Permanently delete ${name}'s account? This also deletes their entire leave history. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Could not delete this member.");
      return;
    }
    router.refresh();
  }

  return (
    <div className={`overflow-hidden ${cardClass}`}>
      <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Name</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Email</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Department</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Projects</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Employee ID</th>
            <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-text-muted)]">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {members.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-text-faint)]">
                No members found.
              </td>
            </tr>
          )}
          {members.map((m) => {
            const s = STATUS_STYLES[m.status];
            return (
              <tr key={m.id} className="hover:bg-[var(--color-surface-muted)]">
                <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">{m.name}</td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{m.email}</td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{m.department ?? "—"}</td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">
                  {m.projects.length ? m.projects.join(", ") : "—"}
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{m.employeeId ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-2.5 text-right">
                  {m.status === "PENDING" && (
                    <>
                      <button
                        disabled={busyId === m.id}
                        onClick={() => updateStatus(m.id, "ACTIVE")}
                        className={approveButtonClass}
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === m.id}
                        onClick={() => updateStatus(m.id, "REJECTED")}
                        className={rejectButtonClass}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {m.status === "ACTIVE" && (
                    <button
                      disabled={busyId === m.id}
                      onClick={() => updateStatus(m.id, "SUSPENDED")}
                      className={neutralButtonClass}
                    >
                      Suspend
                    </button>
                  )}
                  {(m.status === "SUSPENDED" || m.status === "REJECTED") && (
                    <button
                      disabled={busyId === m.id}
                      onClick={() => updateStatus(m.id, "ACTIVE")}
                      className={approveButtonClass}
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    disabled={busyId === m.id}
                    onClick={() => deleteMember(m.id, m.name)}
                    className={dangerLinkClass}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
