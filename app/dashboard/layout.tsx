import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "./_components/sidebar";
import { PreviewBanner } from "./_components/preview-banner";

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
      <div className="flex-1 min-w-0 flex flex-col">
        {session.admin && <PreviewBanner clientName={session.name} />}
        <main className="max-w-5xl mx-auto w-full px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
