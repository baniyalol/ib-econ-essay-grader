import Link from "next/link";
import { decodeShare } from "@/lib/share/encode";
import { ResultView } from "@/components/ResultView";

export const dynamic = "force-dynamic";

export default async function SharedGradePage({
  params,
}: {
  params: { token: string };
}) {
  const payload = decodeShare(params.token);

  if (!payload) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Invalid or expired link
        </h1>
        <p className="mt-2 text-slate-600">
          This share link could not be decoded.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Grade a new essay
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
            Shared grade
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            IB Economics 10-Mark Essay Grade
          </h1>
          {payload.q && (
            <p className="mt-3 max-w-3xl rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-semibold">Question:</span> {payload.q}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Grade my own essay
        </Link>
      </header>

      {/* Shared pages don't carry an API key so we hide the exemplar button. */}
      <ResultView result={payload.r} showExemplar={false} />

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        Shared grades are self-contained in the URL — nothing is stored on our
        servers.
      </footer>
    </main>
  );
}
