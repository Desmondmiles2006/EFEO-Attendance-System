"use client";

import { useEffect, useState } from "react";
import { cardClass, primaryButtonClass } from "@/lib/styles";

type Member = { id: string; name: string; email: string };

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const selectClass =
  "rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
      style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}
    >
      {children}
    </div>
  );
}

const ICONS = {
  table: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18M3 14h18M9 4v16" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" />
    </svg>
  ),
};

export default function ExportPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState("");
  const [memberYear, setMemberYear] = useState(currentYear);
  const [reportYear, setReportYear] = useState(currentYear);
  const [balanceYear, setBalanceYear] = useState(currentYear);
  const [monthlyYear, setMonthlyYear] = useState(currentYear);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetch("/api/admin/members?status=ACTIVE")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members ?? []);
        if (data.members?.[0]) setMemberId(data.members[0].id);
      });
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Export to Excel</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Download attendance and leave data as .xlsx files.</p>
      </div>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-start gap-3">
          <IconBadge>{ICONS.table}</IconBadge>
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Institute-wide report</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">All approved leave entries for the year, one row each.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <select value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))} className={selectClass}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a href={`/api/admin/export/institute?year=${reportYear}`} className={primaryButtonClass}>
            Download
          </a>
        </div>
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-start gap-3">
          <IconBadge>{ICONS.chart}</IconBadge>
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Leave balance summary</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">One row per member: CL / Medical / Special used vs. remaining.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <select value={balanceYear} onChange={(e) => setBalanceYear(Number(e.target.value))} className={selectClass}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a href={`/api/admin/export/balances?year=${balanceYear}`} className={primaryButtonClass}>
            Download
          </a>
        </div>
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-start gap-3">
          <IconBadge>{ICONS.calendar}</IconBadge>
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Monthly attendance sheet</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Calendar-style sheet, color-coded to match the absence code chart.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
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
          <a href={`/api/admin/export/monthly?year=${monthlyYear}&month=${monthlyMonth}`} className={primaryButtonClass}>
            Download
          </a>
        </div>
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-start gap-3">
          <IconBadge>{ICONS.user}</IconBadge>
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Per-member record</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Full leave history for a single member.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={selectClass}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select value={memberYear} onChange={(e) => setMemberYear(Number(e.target.value))} className={selectClass}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={memberId ? `/api/admin/export/member/${memberId}?year=${memberYear}` : undefined}
            aria-disabled={!memberId}
            className={memberId ? primaryButtonClass : `${primaryButtonClass} pointer-events-none opacity-50`}
          >
            Download
          </a>
        </div>
      </section>
    </div>
  );
}
