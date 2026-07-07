import Link from "next/link";
import { YcTracker } from "@/components/yc-tracker";

export const metadata = {
  title: "Folvra — YC traction tracker",
  robots: { index: false, follow: false },
};

export default function YcPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <span className="text-lg font-bold leading-none">F</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">Folvra — YC traction</span>
          </div>
          <div className="flex gap-4 text-sm text-ink-soft">
            <Link href="/founder" className="hover:text-ink">Console</Link>
            <Link href="/dashboard" className="hover:text-ink">Product</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-ink">Traction to show before July 27</h1>
          <p className="mt-2 text-sm text-ink-soft">
            YC funds evidence that users love it, not code. These are the numbers that prove pull —
            update them daily as you run outreach and pilots. The bar isn&apos;t hitting every target;
            it&apos;s a steep, believable curve with real customer quotes behind it.
          </p>
        </div>
        <YcTracker />
      </main>
    </div>
  );
}
