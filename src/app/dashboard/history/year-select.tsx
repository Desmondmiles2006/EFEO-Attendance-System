"use client";

import { useRouter } from "next/navigation";

export function YearSelect({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();

  return (
    <select
      value={year}
      onChange={(e) => router.push(`/dashboard/history?year=${e.target.value}`)}
      className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
