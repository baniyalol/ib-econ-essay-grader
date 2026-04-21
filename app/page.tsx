"use client";

import { useState } from "react";
import { EssayForm } from "@/components/EssayForm";
import { ResultView } from "@/components/ResultView";
import type { GradeResult } from "@/lib/types";
import type { ProviderId } from "@/lib/ai/types";

export default function HomePage() {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <header className="mb-8">
        <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
          IB Economics · Paper 1 Part (b)
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          10-Mark Essay Grader
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Rubric-driven feedback based on the official IB markbands (first
          assessment 2022). Score /10, AO1–AO4 breakdown, band justification,
          highlighted passages, and a Level 4 exemplar outline on demand.
          Works with Claude, GPT, or Gemini.
        </p>
      </header>

      <div className="grid gap-6">
        <EssayForm
          onResult={(r, handoff) => {
            setResult(r);
            setApiKey(handoff.apiKey);
            setProvider(handoff.provider);
            setError("");
          }}
          onError={setError}
          onLoadingChange={setLoading}
          loading={loading}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
            Examiner reading in progress. This usually takes 10–25 seconds.
          </div>
        )}

        {result && !loading && (
          <ResultView result={result} apiKey={apiKey} provider={provider} />
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        Not affiliated with the IB. Grading is an AI approximation of the
        official markbands and should be treated as formative feedback.
      </footer>
    </main>
  );
}
