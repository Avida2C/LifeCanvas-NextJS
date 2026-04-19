import type { Metadata } from "next";
import Link from "next/link";
import { TermsOfServiceContent } from "@/components/legal/terms-of-service-content";

export const metadata: Metadata = {
  title: "Terms and Conditions — Life Canvas",
  description: "Terms and Conditions for using Life Canvas.",
};

export default function TermsPage() {
  return (
    <div className="min-h-0 bg-white text-neutral-800">
      <header className="border-b border-neutral-200 bg-white px-4 py-4">
        <h1 className="mt-3 text-xl font-bold text-neutral-900">Terms and Conditions</h1>
      </header>
      <div className="mx-auto max-w-2xl px-4 pb-4 pt-6">
        <TermsOfServiceContent />
      </div>
    </div>
  );
}
