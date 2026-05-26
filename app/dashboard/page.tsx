import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getClientById,
  getClientContact,
  getClientResources,
  getTasksForClient,
} from "@/lib/notion/data";

export const metadata: Metadata = { title: "Overview · OmniFlow" };

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl text-ink mb-3">{children}</h2>;
}

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await getClientById(session.clientId);
  if (!client) {
    return (
      <p className="text-sm text-gray-500">
        We couldn&apos;t load your client record. Please contact your account manager.
      </p>
    );
  }

  let tasks;
  let contact;
  try {
    [tasks, contact] = await Promise.all([
      getTasksForClient(client.id),
      getClientContact(client),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load data.";
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Couldn&apos;t reach Notion</p>
        <p className="text-amber-800">{message}</p>
      </div>
    );
  }

  const resources = getClientResources(client);
  const toReview = tasks.filter((t) => t.needsClientInput);
  const firstName = session.name.split(" ")[0] || session.name;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink">
          <ellipse cx="12" cy="8" rx="8" ry="3.4" />
          <path d="M4 8c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4" />
          <path d="M4 12.5c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4" />
        </svg>
        <h1 className="font-display text-3xl text-ink">Great to see you, {firstName}.</h1>
      </div>
      <hr className="border-gray-200 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionHeading>Announcements</SectionHeading>
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
              No announcements right now.
            </div>
          </section>

          <section>
            <SectionHeading>Orders to Review</SectionHeading>
            {toReview.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
                You&apos;re all caught up — nothing needs your review.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {toReview.slice(0, 6).map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/orders?open=${t.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{t.category ?? "Deliverable"}</p>
                      <p className="font-medium text-ink truncate">{t.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand shrink-0">Review →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionHeading>Resources</SectionHeading>
            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              {resources.length === 0 ? (
                <p className="text-sm text-gray-400">No resources shared yet.</p>
              ) : (
                resources.map((r) => (
                  <a
                    key={r.label}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-brand underline underline-offset-2 hover:text-brand-hover"
                  >
                    {r.label}
                  </a>
                ))
              )}
            </div>
          </section>

          <section>
            <SectionHeading>Contact Your Campaign Manager</SectionHeading>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              {contact ? (
                <>
                  <p className="font-semibold text-ink">{contact.name}</p>
                  {contact.role && <p className="text-sm text-gray-500">{contact.role}</p>}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover"
                    >
                      ✉ {contact.email}
                    </a>
                  )}
                  {contact.bookingUrl && (
                    <a
                      href={contact.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block text-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
                    >
                      Book a Call
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  Your campaign manager will appear here once assigned.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
