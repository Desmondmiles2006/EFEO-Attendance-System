"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass, errorBannerClass, warningBannerClass } from "@/lib/styles";

type LeaveType = { id: string; code: string; name: string };
type Project = { id: string; name: string };

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    projectId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/leave-types")
      .then((res) => res.json())
      .then((data) => setLeaveTypes(data.leaveTypes ?? []));
    fetch("/api/projects/mine")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    const payload = {
      ...form,
      endDate: form.endDate || form.startDate,
    };

    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit request.");
      return;
    }

    if (data.warning) {
      setWarning(data.warning);
      setTimeout(() => router.push("/dashboard/history"), 2500);
      return;
    }

    router.push("/dashboard/history");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Submit a leave / absence request</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Your request goes to an administrator for approval before it&apos;s recorded.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        {projects.length > 0 && (
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
        {warning && <p className={warningBannerClass}>{warning} Redirecting to your history…</p>}

        <button type="submit" disabled={loading} className={`w-full ${primaryButtonClass}`}>
          {loading ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
