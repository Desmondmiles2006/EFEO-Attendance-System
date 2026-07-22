"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass, errorBannerClass, warningBannerClass } from "@/lib/styles";

type Member = { id: string; name: string; email: string; department: string | null };
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

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Assign leave to a member</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Recorded as approved immediately — use this to log leave on a member&apos;s behalf, backdate an
        entry, or credit/debit compensatory days.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className={labelClass}>Member</label>
          <select
            required
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value, projectId: "" }))}
            className={inputClass}
          >
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
