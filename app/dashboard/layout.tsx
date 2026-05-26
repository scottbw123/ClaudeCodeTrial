import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "./_components/sidebar";

// Reads the session cookie on every request — always render dynamically.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar name={session.name} email={session.email} />
      <div className="flex-1 min-w-0">
        <main className="max-w-5xl mx-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
