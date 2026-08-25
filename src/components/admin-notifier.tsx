"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const POLL_MS = 30_000;

type Perm = NotificationPermission | "unsupported";

type PendingRequest = {
  id: string;
  member: string;
  code: string;
  startDate: string;
  endDate: string;
};

// Read the browser's Notification permission as an external store so we avoid
// mount-time setState and get correct SSR/hydration behaviour.
const permListeners = new Set<() => void>();
function subscribePerm(cb: () => void) {
  permListeners.add(cb);
  return () => permListeners.delete(cb);
}
function emitPermChange() {
  permListeners.forEach((l) => l());
}
function getPermSnapshot(): Perm {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
function getPermServerSnapshot(): Perm {
  return "default";
}

export function AdminNotifier() {
  const perm = useSyncExternalStore(subscribePerm, getPermSnapshot, getPermServerSnapshot);
  const seen = useRef<Set<string>>(new Set());
  const baselined = useRef(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/pending", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const reqs: PendingRequest[] = data.requests ?? [];

      // First poll after enabling: record everything already pending so we only
      // notify for requests that arrive from now on (no backlog spam).
      if (!baselined.current) {
        reqs.forEach((r) => seen.current.add(r.id));
        baselined.current = true;
        return;
      }

      const fresh = reqs.filter((r) => !seen.current.has(r.id));
      fresh.forEach((r) => seen.current.add(r.id));

      // Oldest first so the newest ends up on top of the notification stack.
      fresh.reverse().forEach((r) => {
        const n = new Notification("New leave request", {
          body: `${r.member} — ${r.code}`,
          icon: "/efeo-logo.png",
          tag: `leave-${r.id}`,
        });
        n.onclick = () => {
          window.focus();
          window.location.href = "/admin/requests";
        };
      });
    } catch {
      // Network hiccups shouldn't break the admin UI; try again next tick.
    }
  }, []);

  useEffect(() => {
    if (perm !== "granted") return;
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [perm, poll]);

  async function enable() {
    await Notification.requestPermission();
    emitPermChange();
  }

  if (perm === "unsupported" || perm === "granted") return null;

  if (perm === "denied") {
    return (
      <div className="mb-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-xs text-[var(--color-text-faint)]">
        Desktop notifications are blocked in your browser. To get alerted about new leave requests,
        allow notifications for this site in your browser settings.
      </div>
    );
  }

  // perm === "default"
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-md border border-[var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-[var(--color-accent-dark)]">
        Get a desktop alert whenever a member submits a new leave request.
      </span>
      <button
        onClick={enable}
        className="shrink-0 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-dark)]"
      >
        Enable notifications
      </button>
    </div>
  );
}
