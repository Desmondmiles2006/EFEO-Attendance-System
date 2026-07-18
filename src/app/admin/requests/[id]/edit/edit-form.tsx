"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, errorBannerClass, warningBannerClass } from "@/lib/styles";

type LeaveType = { id: string; code: string; name: string };

export function EditLeaveForm({
  id,
  initial,
}: {
  id: string;
  initial: { leaveTypeId: string; startDate: string; endDate: string; reason: string };
}) {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/leave-types")
      .then((res) => res.json())
      .then((data) => setLeaveTypes(data.leaveTypes ?? []));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    const res = await fetch(`/api/admin/leave-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save changes.");
      return;
    }

    if (data.warning) {
      setWarning(data.warning);
      setTimeout(() => router.push("/admin/requests?status="), 2000);
      return;
    }

    router.push("/admin/requests?status=");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className={labelClass}>Leave type</label>
        <select
          required
          value={form.leaveTypeId}
          onChange={(e) => update("leaveTypeId", e.target.value)}
          className={inputClass}
        >
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
          <label className={labelClass}>End date</label>
          <input
            type="date"
            required
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => update("endDate", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

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
      {warning && <p className={warningBannerClass}>{warning} Redirecting…</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/requests?status=")} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}
