"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { inputClass, labelClass, primaryButtonClass, errorBannerClass, cardClass } from "@/lib/styles";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    employeeId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }

    router.push("/pending");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className={`w-full max-w-sm ${cardClass} p-8 shadow-sm`}>
          <Logo size="lg" />
          <h1 className="mt-6 text-xl font-semibold text-[var(--color-text)]">Register</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Create your EFEO attendance account. An administrator must approve it before you can sign in.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={labelClass}>Full name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Department <span className="text-[var(--color-text-faint)]">(optional)</span>
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Employee ID <span className="text-[var(--color-text-faint)]">(optional)</span>
              </label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => update("employeeId", e.target.value)}
                className={inputClass}
              />
            </div>

            {error && <p className={errorBannerClass}>{error}</p>}

            <button type="submit" disabled={loading} className={`w-full ${primaryButtonClass}`}>
              {loading ? "Submitting..." : "Register"}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
