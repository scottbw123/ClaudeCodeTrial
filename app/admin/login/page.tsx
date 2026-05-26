import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = { title: "Admin · OmniFlow" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-ink">Admin Preview</h1>
          <p className="mt-1 text-sm text-gray-500">Internal access — view any client&apos;s dashboard.</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
