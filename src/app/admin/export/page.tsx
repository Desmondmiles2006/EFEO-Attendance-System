"use client";

import { useEffect, useState } from "react";

type Member = { id: string; name: string; email: string };

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Export to Excel</h1>
        <p className="mt-1 text-sm text-slate-500">Download attendance and leave data as .xlsx files.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Institute-wide report</h2>
        <p className="mt-1 text-sm text-slate-500">All approved leave entries for the year, one row each.</p>
        <div className="mt-3 flex items-center gap-3">
          <select
            value={reportYear}
            onChange={(e) => setReportYear(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={`/api/admin/export/institute?year=${reportYear}`}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Download
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Leave balance summary</h2>
        <p className="mt-1 text-sm text-slate-500">One row per member: CL / Medical / Special used vs. remaining.</p>
        <div className="mt-3 flex items-center gap-3">
          <select
            value={balanceYear}
            onChange={(e) => setBalanceYear(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={`/api/admin/export/balances?year=${balanceYear}`}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Download
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Monthly attendance sheet</h2>
        <p className="mt-1 text-sm text-slate-500">Calendar-style sheet, color-coded to match the absence code chart.</p>
        <div className="mt-3 flex items-center gap-3">
          <select
            value={monthlyMonth}
            onChange={(e) => setMonthlyMonth(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={monthlyYear}
            onChange={(e) => setMonthlyYear(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={`/api/admin/export/monthly?year=${monthlyYear}&month=${monthlyMonth}`}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Download
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Per-member record</h2>
        <p className="mt-1 text-sm text-slate-500">Full leave history for a single member.</p>
        <div className="mt-3 flex items-center gap-3">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={memberYear}
            onChange={(e) => setMemberYear(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={memberId ? `/api/admin/export/member/${memberId}?year=${memberYear}` : undefined}
            aria-disabled={!memberId}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
              memberId ? "bg-blue-600 hover:bg-blue-700" : "pointer-events-none bg-slate-300"
            }`}
          >
            Download
          </a>
        </div>
      </section>
    </div>
  );
}
