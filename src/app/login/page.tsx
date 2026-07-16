"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { inputClass, labelClass, primaryButtonClass, errorBannerClass, cardClass } from "@/lib/styles";

const ERROR_MESSAGES: Record<string, string> = {
  pending: "Your account is awaiting admin approval. Please check back later.",
  rejected: "Your registration was not approved. Contact an administrator.",
  suspended: "Your account has been suspended. Contact an administrator.",
  credentials: "Incorrect email or password.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(ERROR_MESSAGES[result.code ?? ""] ?? "Sign in failed. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className={`w-full max-w-sm ${cardClass} p-8 shadow-sm`}>
      <Logo size="lg" />
      <h1 className="mt-6 text-xl font-semibold text-[var(--color-text)]">Attendance System</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className={errorBannerClass}>{error}</p>}

        <button type="submit" disabled={loading} className={`w-full ${primaryButtonClass}`}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-[var(--color-text-muted)]">
        New member?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent)] hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
