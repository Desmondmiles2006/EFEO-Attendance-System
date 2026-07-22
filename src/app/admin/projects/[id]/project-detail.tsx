"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  errorBannerClass,
  dangerLinkClass,
} from "@/lib/styles";

type Member = { id: string; name: string; email?: string; department: string | null };

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const selectClass =
  "rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

export function ProjectDetail({
  project,
  allActiveMembers,
}: {
  project: { id: string; name: string; description: string; members: Member[] };
  allActiveMembers: Member[];
}) {
  const router = useRouter();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaSaved, setMetaSaved] = useState(false);

  const [addId, setAddId] = useState("");
  const [busy, setBusy] = useState(false);

  const [reportYear, setReportYear] = useState(currentYear);
  const [balanceYear, setBalanceYear] = useState(currentYear);
  const [monthlyYear, setMonthlyYear] = useState(currentYear);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  const assignedIds = useMemo(() => new Set(project.members.map((m) => m.id)), [project.members]);
  const assignable = allActiveMembers.filter((m) => !assignedIds.has(m.id));

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    setMetaError(null);
    setMetaSaved(false);
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingMeta(false);
    if (!res.ok) {
      setMetaError(data.error ?? "Could not save.");
      return;
    }
    setMetaSaved(true);
    router.refresh();
  }

  async function addMember() {
    if (!addId) return;
    setBusy(true);
    await fetch(`/api/admin/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addId }),
    });
    setAddId("");
    setBusy(false);
    router.refresh();
  }

  async function removeMember(userId: string) {
    setBusy(true);
    await fetch(`/api/admin/projects/${project.id}/members?userId=${userId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  const base = `/api/admin/export/project/${project.id}`;

  return (
    <div className="space-y-8">
      {/* Rename / description */}
      <form onSubmit={saveMeta} className={`${cardClass} p-5`}>
        <h2 className="font-semibold text-[var(--color-text)]">Project details</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Description <span className="text-[var(--color-text-faint)]">(optional)</span>
            </label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
        </div>
        {metaError && <p className={`mt-3 ${errorBannerClass}`}>{metaError}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="submit" disabled={savingMeta} className={primaryButtonClass}>
            {savingMeta ? "Saving..." : "Save"}
          </button>
          {metaSaved && <span className="text-sm text-[var(--color-success)]">Saved.</span>}
        </div>
      </form>

      {/* Members */}
      <div className={`${cardClass} p-5`}>
        <h2 className="font-semibold text-[var(--color-text)]">Members ({project.members.length})</h2>

        <div className="mt-3 flex items-center gap-3">
          <select value={addId} onChange={(e) => setAddId(e.target.value)} className={`${selectClass} flex-1`}>
            <option value="">
              {assignable.length ? "Select a member to add…" : "All active members are already assigned"}
            </option>
            {assignable.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.department ? ` — ${m.department}` : ""}
              </option>
            ))}
          </select>
          <button onClick={addMember} disabled={busy || !addId} className={primaryButtonClass}>
            Add
          </button>
        </div>

        <ul className="mt-4 divide-y divide-[var(--color-border)]">
          {project.members.length === 0 && (
            <li className="py-3 text-sm text-[var(--color-text-faint)]">No members assigned yet.</li>
          )}
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2.5">
              <div>
                <span className="text-sm font-medium text-[var(--color-text)]">{m.name}</span>
                <span className="ml-2 text-xs text-[var(--color-text-faint)]">{m.department ?? m.email}</span>
              </div>
              <button onClick={() => removeMember(m.id)} disabled={busy} className={dangerLinkClass}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Exports */}
      <div className={`${cardClass} p-5`}>
        <h2 className="font-semibold text-[var(--color-text)]">Export {project.name} attendance</h2>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          Report &amp; monthly sheet cover leave tagged to this project. Balance summary shows this project&apos;s
          members with their full yearly quota usage.
        </p>

        <div className="mt-4 space-y-4">
          {/* Report */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-sm font-medium text-[var(--color-text)]">Tagged leave report</span>
            <select value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <a href={`${base}?type=report&year=${reportYear}`} className={secondaryButtonClass}>
              Download
            </a>
          </div>

          {/* Monthly */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-sm font-medium text-[var(--color-text)]">Monthly calendar</span>
            <select value={monthlyMonth} onChange={(e) => setMonthlyMonth(Number(e.target.value))} className={selectClass}>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select value={monthlyYear} onChange={(e) => setMonthlyYear(Number(e.target.value))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <a href={`${base}?type=monthly&year=${monthlyYear}&month=${monthlyMonth}`} className={secondaryButtonClass}>
              Download
            </a>
          </div>

          {/* Balances */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-sm font-medium text-[var(--color-text)]">Balance summary</span>
            <select value={balanceYear} onChange={(e) => setBalanceYear(Number(e.target.value))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <a href={`${base}?type=balances&year=${balanceYear}`} className={secondaryButtonClass}>
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
