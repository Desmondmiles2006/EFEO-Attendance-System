import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/requests", label: "Leave Requests" },
  { href: "/admin/export", label: "Export" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar name={session.user.name ?? session.user.email ?? "Admin"} role={session.user.role} links={LINKS} />
      <div className="flex flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
