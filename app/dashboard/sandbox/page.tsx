import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sandbox · OmniFlow" };

export default function SandboxPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Sandbox</h1>
      <hr className="border-gray-200 mb-6" />
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-sm text-gray-500">
        A space for experimenting with upcoming features. Nothing here yet.
      </div>
    </div>
  );
}
