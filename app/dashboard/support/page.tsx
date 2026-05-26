import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support · OmniFlow" };

export default function SupportPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Support</h1>
      <hr className="border-gray-200 mb-6" />
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-sm text-gray-500">
        Need help? Reach out to your campaign manager from the Overview page, or
        email <span className="text-ink">support@omniflow.us</span>. A full help
        center is coming soon.
      </div>
    </div>
  );
}
