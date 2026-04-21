"use client";

import { useState } from "react";
import type { ExemplarResponse, GradeResult } from "@/lib/types";
import type { ProviderId } from "@/lib/ai/types";

interface Props {
  result: GradeResult;
  apiKey?: string;
  provider?: ProviderId;
}

export function ExemplarCard({ result, apiKey, provider = "anthropic" }: Props) {
  const [loading, setLoading] = useState(false);
  const [exemplar, setExemplar] = useState<ExemplarResponse | null>(null);
  const [error, setError] = useState<string>("");

  async function fetchExemplar() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/exemplar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: result.question,
          apiKey,
          provider,
          grade: {
            score: result.score,
            level: result.level,
            missing_elements: result.missing_elements,
            errors: result.errors,
            weaknesses: result.weaknesses,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Request failed with status ${res.status}`);
        return;
      }
      setExemplar(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Level 4 exemplar outline
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            What a 9–10 answer to this specific question would have included —
            and what you specifically missed.
          </p>
        </div>
        {!exemplar && (
          <button
            type="button"
            onClick={fetchExemplar}
            disabled={loading}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {loading ? "Generating…" : "Show me a Level 4 version"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {exemplar && (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-slate-800">What you missed</h4>
            <ul className="mt-2 space-y-1.5">
              {exemplar.what_you_missed.map((m, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <Section
              label="Introduction"
              body={exemplar.exemplar_outline.introduction}
            />
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Definitions
              </h5>
              <ul className="mt-1 space-y-1">
                {exemplar.exemplar_outline.definitions.map((d, i) => (
                  <li key={i} className="text-slate-800">
                    <span className="text-slate-400">– </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <Section
              label="Theory & diagram"
              body={exemplar.exemplar_outline.theory_and_diagram}
            />
            <Section
              label="Application example"
              body={exemplar.exemplar_outline.application_example}
            />
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Evaluation points
              </h5>
              <ul className="mt-1 space-y-1">
                {exemplar.exemplar_outline.evaluation_points.map((e, i) => (
                  <li key={i} className="text-slate-800">
                    <span className="text-slate-400">– </span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <Section label="Judgment" body={exemplar.exemplar_outline.judgment} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </h5>
      <p className="mt-1 text-slate-800">{body}</p>
    </div>
  );
}
