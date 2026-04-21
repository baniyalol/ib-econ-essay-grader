"use client";

import { useEffect, useRef } from "react";
import type { FiveFeedbackItems, GradeResult } from "@/lib/types";
import { findQuoteIndex } from "@/lib/util/quoteMatch";

interface Props {
  essay: string;
  result: GradeResult;
  activeQuote?: string;
}

/**
 * Renders the essay with every feedback quote highlighted. When `activeQuote`
 * changes, the corresponding highlight scrolls into view + flashes.
 */
export function AnnotatedEssay({ essay, result, activeQuote }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeQuote || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-quote="${cssEscape(activeQuote)}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeQuote]);

  if (!essay) return null;

  const highlights = collectHighlights(result, essay);
  const spans = buildSpans(essay, highlights);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Your essay · annotated
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Click a strength, weakness, or improvement above to jump to the
        relevant passage.
      </p>
      <div
        ref={containerRef}
        className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-5 font-serif text-[15px] leading-relaxed text-slate-900"
      >
        {spans.map((s, i) =>
          s.kind === "text" ? (
            <span key={i}>{s.text}</span>
          ) : (
            <mark
              key={i}
              data-quote={s.quote}
              className={`rounded px-0.5 transition ${toneClass(s.tone)} ${
                activeQuote === s.quote
                  ? "outline outline-2 outline-yellow-500"
                  : ""
              }`}
            >
              {s.text}
            </mark>
          ),
        )}
      </div>
      <Legend />
    </div>
  );
}

type Tone = "positive" | "negative" | "neutral";
interface Highlight {
  /** The quote as returned by the model (used as click key). */
  quote: string;
  tone: Tone;
}

function collectHighlights(result: GradeResult, essay: string): Highlight[] {
  const out: Highlight[] = [];
  const push = (items: FiveFeedbackItems, tone: Tone) => {
    for (const it of items) {
      if (!it.quote) continue;
      if (findQuoteIndex(essay, it.quote) === -1) continue;
      out.push({ quote: it.quote, tone });
    }
  };
  push(result.strengths, "positive");
  push(result.weaknesses, "negative");
  push(result.improvements, "neutral");
  return out;
}

type Span =
  | { kind: "text"; text: string }
  | { kind: "mark"; text: string; quote: string; tone: Tone };

function buildSpans(essay: string, highlights: Highlight[]): Span[] {
  if (highlights.length === 0) {
    return [{ kind: "text", text: essay }];
  }
  const spans: Span[] = [];
  let cursor = 0;
  while (cursor < essay.length) {
    let bestIdx = -1;
    let bestHighlight: Highlight | null = null;
    for (const h of highlights) {
      const idx = findInEssayFromCursor(essay, h.quote, cursor);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestHighlight = h;
      }
    }
    if (bestIdx === -1 || !bestHighlight) {
      spans.push({ kind: "text", text: essay.slice(cursor) });
      break;
    }
    if (bestIdx > cursor) {
      spans.push({ kind: "text", text: essay.slice(cursor, bestIdx) });
    }
    // Use the ORIGINAL essay slice so casing/punctuation is preserved in the UI.
    const sliced = essay.slice(bestIdx, bestIdx + bestHighlight.quote.length);
    spans.push({
      kind: "mark",
      text: sliced,
      quote: bestHighlight.quote,
      tone: bestHighlight.tone,
    });
    cursor = bestIdx + bestHighlight.quote.length;
  }
  return spans;
}

function findInEssayFromCursor(
  essay: string,
  quote: string,
  cursor: number,
): number {
  const direct = essay.indexOf(quote, cursor);
  if (direct !== -1) return direct;
  const lowerIdx = essay.toLowerCase().indexOf(quote.toLowerCase(), cursor);
  return lowerIdx;
}

function toneClass(tone: Tone): string {
  if (tone === "positive") return "bg-emerald-100";
  if (tone === "negative") return "bg-red-100";
  return "bg-blue-100";
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
      <LegendItem className="bg-emerald-100" label="Strength" />
      <LegendItem className="bg-red-100" label="Weakness" />
      <LegendItem className="bg-blue-100" label="Improvement target" />
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-5 rounded ${className}`} />
      {label}
    </span>
  );
}

function cssEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
