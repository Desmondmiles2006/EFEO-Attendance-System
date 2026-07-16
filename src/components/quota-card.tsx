import { cardClass } from "@/lib/styles";

export function QuotaCard({ group, used, quota, remaining }: { group: string; used: number; quota: number; remaining: number }) {
  const over = remaining < 0;
  const pct = Math.min(100, Math.round((used / quota) * 100));

  return (
    <div className={`${cardClass} p-4 ${over ? "border-[var(--color-danger-border)]" : ""}`}>
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{group}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
        {used} <span className="text-base font-normal text-[var(--color-text-faint)]">/ {quota} days</span>
      </p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: over ? "var(--color-danger)" : "var(--color-accent)",
          }}
        />
      </div>

      <p
        className="mt-2 text-xs font-medium"
        style={{ color: over ? "var(--color-danger)" : "var(--color-text-faint)" }}
      >
        {over ? `${Math.abs(remaining)} day(s) over quota` : `${remaining} day(s) remaining`}
      </p>
    </div>
  );
}
