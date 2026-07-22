"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/logo";

export function Sidebar({
  name,
  role,
  links,
}: {
  name: string;
  role: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] px-5 py-5">
        <Logo size="md" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          // Highlight the section when on its page or any sub-path (e.g. /admin/projects/123),
          // but keep the index link (/admin, /dashboard) exact-match only.
          const isIndex = link.href === "/admin" || link.href === "/dashboard";
          const active = isIndex
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-dark)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-4">
        <p className="truncate text-sm font-medium text-[var(--color-text)]">{name}</p>
        <p className="text-xs text-[var(--color-text-faint)]">{role}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
