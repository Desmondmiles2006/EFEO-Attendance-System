import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Registration received</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your account has been created and is waiting for an administrator to approve it.
          You&apos;ll be able to sign in once it&apos;s approved.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
