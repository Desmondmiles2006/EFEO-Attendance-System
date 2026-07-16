"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LeaveType = { id: string; code: string; name: string };

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
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
      <h1 className="text-xl font-semibold text-slate-900">Submit a leave / absence request</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your request goes to an administrator for approval before it&apos;s recorded.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Leave type</label>
          <select
            required
            value={form.leaveTypeId}
            onChange={(e) => update("leaveTypeId", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-slate-700">Start date</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              End date <span className="text-slate-400">(same day if blank)</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => update("endDate", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Reason</label>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {warning && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {warning} Redirecting to your history…
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
