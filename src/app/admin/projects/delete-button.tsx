"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dangerLinkClass } from "@/lib/styles";

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (
      !window.confirm(
        `Delete project "${name}"? Members will be unassigned and any leave tagged to it becomes untagged. Leave records themselves are kept.`
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      window.alert("Could not delete this project.");
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} className={dangerLinkClass}>
      Delete
    </button>
  );
}
