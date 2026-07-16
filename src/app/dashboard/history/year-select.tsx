"use client";

import { useRouter } from "next/navigation";

export function YearSelect({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();

  return (
    <select
      value={year}
      onChange={(e) => router.push(`/dashboard/history?year=${e.target.value}`)}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
