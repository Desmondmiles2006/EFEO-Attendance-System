const CONFIG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  PENDING: {
    label: "Pending",
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-border)",
    text: "var(--color-warning)",
    dot: "var(--color-warning)",
  },
  APPROVED: {
    label: "Approved",
    bg: "var(--color-success-bg)",
    border: "var(--color-success-border)",
    text: "var(--color-success)",
    dot: "var(--color-success)",
  },
  REJECTED: {
    label: "Rejected",
    bg: "var(--color-danger-bg)",
    border: "var(--color-danger-border)",
    text: "var(--color-danger)",
    dot: "var(--color-danger)",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "var(--color-neutral-bg)",
    border: "var(--color-neutral-border)",
    text: "var(--color-neutral)",
    dot: "var(--color-neutral)",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const c = CONFIG[status] ?? CONFIG.CANCELLED;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}
