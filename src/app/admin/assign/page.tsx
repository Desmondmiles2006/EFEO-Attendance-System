"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  errorBannerClass,
  warningBannerClass,
} from "@/lib/styles";

type Member = { id: string; name: string; email: string; department: string | null; employeeId: string | null };
type LeaveType = { id: string; code: string; name: string };
type Project = { id: string; name: string };

export default function AssignLeavePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    userId: "",
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    projectId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password reset (admin sets a new password for the selected member)
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === form.userId) ?? null,
    [members, form.userId]
  );

  useEffect(() => {
    fetch("/api/admin/members?status=ACTIVE")
      .then((res) => res.json())
      .then((data) => setMembers(data.members ?? []));
    fetch("/api/leave-types")
      .then((res) => res.json())
      .then((data) => setLeaveTypes(data.leaveTypes ?? []));
  }, []);

  // Load the selected member's projects. (projectId is reset in the member onChange handler.)
  useEffect(() => {
    if (!form.userId) return;
    let active = true;
    fetch(`/api/admin/members/${form.userId}/projects`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setProjects(data.projects ?? []);
      });
    return () => {
      active = false;
    };
  }, [form.userId]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function selectMember(userId: string) {
    setForm((f) => ({ ...f, userId, projectId: "" }));
    setProjects([]);
    setNewPassword("");
    setPwMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    setSuccess(null);

    const payload = {
      ...form,
      endDate: form.endDate || form.startDate,
    };

    const res = await fetch("/api/admin/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not assign leave.");
      return;
    }

    setSuccess("Leave assigned and recorded as approved.");
    if (data.warning) setWarning(data.warning);
    setForm((f) => ({ ...f, leaveTypeId: "", startDate: "", endDate: "", reason: "" }));
    router.refresh();
  }

  async function resetPassword() {
    if (!form.userId) return;
    setPwLoading(true);
    setPwMsg(null);
    const res = await fetch(`/api/admin/members/${form.userId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setPwLoading(false);
    if (!res.ok) {
      setPwMsg({ ok: false, text: data.error ?? "Could not set the password." });
      return;
    }
    setPwMsg({
      ok: true,
      text: `New password set. Share it with ${selectedMember?.name ?? "the member"}: ${newPassword}`,
    });
    setNewPassword("");
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Assign leave to a member</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Recorded as approved immediately — use this to log leave on a member&apos;s behalf, backdate an
          entry, or credit/debit compensatory days.
        </p>
      </div>

      {/* Member selector */}
      <div>
        <label className={labelClass}>Member</label>
        <select required value={form.userId} onChange={(e) => selectMember(e.target.value)} className={inputClass}>
          <option value="" disabled>
            Select a member
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.department ? `— ${m.department}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Member details panel */}
      {selectedMember && (
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{selectedMember.name}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-faint)]">Email</dt>
              <dd className="text-sm text-[var(--color-text)]">{selectedMember.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-faint)]">Department</dt>
              <dd className="text-sm text-[var(--color-text)]">{selectedMember.department ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-faint)]">Employee ID</dt>
              <dd className="text-sm text-[var(--color-text)]">{selectedMember.employeeId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-faint)]">Projects</dt>
              <dd className="text-sm text-[var(--color-text)]">
                {projects.length ? projects.map((p) => p.name).join(", ") : "—"}
              </dd>
            </div>
          </dl>

          {/* Reset password */}
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <label className={labelClass}>
              Set a new password{" "}
              <span className="font-normal text-[var(--color-text-faint)]">
                (if they forgot theirs — the old one can&apos;t be viewed)
              </span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={resetPassword}
                disabled={pwLoading || newPassword.length < 8}
                className={secondaryButtonClass}
              >
                {pwLoading ? "Saving..." : "Set"}
              </button>
            </div>
            {pwMsg && (
              <p
                className="mt-2 rounded-md px-3 py-2 text-sm font-medium"
                style={{
                  backgroundColor: pwMsg.ok ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                  color: pwMsg.ok ? "var(--color-success)" : "var(--color-danger)",
                }}
              >
                {pwMsg.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Assign leave form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Leave type</label>
          <select
            required
            value={form.leaveTypeId}
            onChange={(e) => update("leaveTypeId", e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Select a type
            </option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.code} — {lt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start date</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              End date <span className="text-[var(--color-text-faint)]">(same day if blank)</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => update("endDate", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {form.userId && projects.length > 0 && (
          <div>
            <label className={labelClass}>
              Project <span className="text-[var(--color-text-faint)]">(optional)</span>
            </label>
            <select
              value={form.projectId}
              onChange={(e) => update("projectId", e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Reason</label>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className={errorBannerClass}>{error}</p>}
        {warning && <p className={warningBannerClass}>{warning}</p>}
        {success && (
          <p className="rounded-md border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-2 text-sm font-medium text-[var(--color-success)]">
            {success}
          </p>
        )}

        <button type="submit" disabled={loading} className={`w-full ${primaryButtonClass}`}>
          {loading ? "Assigning..." : "Assign leave"}
        </button>
      </form>
    </div>
  );
}
