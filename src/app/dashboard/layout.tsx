import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/leave/new", label: "Submit Leave" },
  { href: "/dashboard/history", label: "History" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Nav name={session.user.name ?? session.user.email ?? "User"} role={session.user.role} links={LINKS} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
