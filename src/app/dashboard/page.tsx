import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeadsInbox } from "@/components/leads-inbox";

export const metadata = {
  title: "Folvra — Leads inbox",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white">
              <span className="text-base font-bold leading-none">F</span>
            </div>
            <span className="font-bold tracking-tight text-ink">Folvra</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </header>
      <main className="px-5 py-6">
        <LeadsInbox />
      </main>
    </div>
  );
}
