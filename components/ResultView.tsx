"use client";

import { useState } from "react";
import type { GradeResult } from "@/lib/types";
import type { ProviderId } from "@/lib/ai/types";
import { ScoreHeader } from "./ScoreHeader";
import { AOBreakdown } from "./AOBreakdown";
import { FeedbackLists } from "./FeedbackLists";
import { AnnotatedEssay } from "./AnnotatedEssay";
import {
  ErrorsCard,
  JustificationCard,
  MissingElementsCard,
} from "./DiagnosticsCards";
import { ExemplarCard } from "./ExemplarCard";

interface Props {
  result: GradeResult;
  apiKey?: string;
  provider?: ProviderId;
  /** Hide the exemplar button on shared pages where we don't have a key. */
  showExemplar?: boolean;
}

export function ResultView({
  result,
  apiKey,
  provider,
  showExemplar = true,
}: Props) {
  const [activeQuote, setActiveQuote] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      <ScoreHeader result={result} />
      <JustificationCard result={result} />
      <div className="grid gap-6 md:grid-cols-2">
        <MissingElementsCard result={result} />
        <ErrorsCard result={result} />
      </div>
      <AOBreakdown result={result} />
      <FeedbackLists
        result={result}
        onQuoteClick={(q) => setActiveQuote((prev) => (prev === q ? undefined : q))}
        activeQuote={activeQuote}
      />
      {result.essay && (
        <AnnotatedEssay
          essay={result.essay}
          result={result}
          activeQuote={activeQuote}
        />
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Overall feedback
        </h3>
        <p className="text-sm leading-relaxed text-slate-800">
          {result.overall_feedback}
        </p>
      </div>
      {showExemplar && result.question && (
        <ExemplarCard result={result} apiKey={apiKey} provider={provider} />
      )}
    </div>
  );
}
