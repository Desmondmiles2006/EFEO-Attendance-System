import Link from "next/link";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { primaryButtonClass, cardClass } from "@/lib/styles";

export default function PendingPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className={`w-full max-w-sm ${cardClass} p-8 text-center shadow-sm`}>
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-[var(--color-text)]">Registration received</h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Your account has been created and is waiting for an administrator to approve it.
            You&apos;ll be able to sign in once it&apos;s approved.
          </p>
          <Link href="/login" className={`mt-6 inline-block ${primaryButtonClass}`}>
            Back to sign in
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
