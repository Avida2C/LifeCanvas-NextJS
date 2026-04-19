import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy — Life Canvas",
  description: "Privacy Policy for Life Canvas.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-0 bg-white text-neutral-800">
      <header className="border-b border-neutral-200 bg-white px-4 py-4">
        <Link
          href="/me"
          className="text-sm font-medium text-[#eb6135] underline-offset-2 hover:underline"
        >
          ← Life Canvas
        </Link>
        <h1 className="mt-3 text-xl font-bold text-neutral-900">Privacy Policy</h1>
      </header>
      <div className="mx-auto max-w-2xl px-4 pb-4 pt-6">
        <PrivacyPolicyContent />
      </div>
    </div>
  );
}
