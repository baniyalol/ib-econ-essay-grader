"use client";

import type { FeedbackItem, FiveFeedbackItems, GradeResult } from "@/lib/types";
import { quoteIsInEssay } from "@/lib/util/quoteMatch";

interface Props {
  result: GradeResult;
  onQuoteClick: (quote: string | undefined) => void;
  activeQuote?: string;
}

export function FeedbackLists({ result, onQuoteClick, activeQuote }: Props) {
  const essay = result.essay ?? "";
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FeedbackCard
        title="Strengths"
        items={result.strengths}
        tone="positive"
        essay={essay}
        onQuoteClick={onQuoteClick}
        activeQuote={activeQuote}
      />
      <FeedbackCard
        title="Weaknesses"
        items={result.weaknesses}
        tone="negative"
        essay={essay}
        onQuoteClick={onQuoteClick}
        activeQuote={activeQuote}
      />
      <FeedbackCard
        title="Improvements"
        items={result.improvements}
        tone="neutral"
        essay={essay}
        onQuoteClick={onQuoteClick}
        activeQuote={activeQuote}
      />
    </div>
  );
}

function FeedbackCard({
  title,
  items,
  tone,
  essay,
  onQuoteClick,
  activeQuote,
}: {
  title: string;
  items: FiveFeedbackItems;
  tone: "positive" | "negative" | "neutral";
  essay: string;
  onQuoteClick: (q: string | undefined) => void;
  activeQuote?: string;
}) {
  const palette =
    tone === "positive"
      ? { ring: "ring-emerald-200", dot: "bg-emerald-500", label: "text-emerald-700" }
      : tone === "negative"
        ? { ring: "ring-red-200", dot: "bg-red-500", label: "text-red-700" }
        : { ring: "ring-blue-200", dot: "bg-blue-500", label: "text-blue-700" };

  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ${palette.ring}`}>
      <h3
        className={`mb-4 text-xs font-semibold uppercase tracking-wider ${palette.label}`}
      >
        {title}
      </h3>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <FeedbackRow
            key={i}
            item={it}
            dotClass={palette.dot}
            essay={essay}
            onClick={() => onQuoteClick(it.quote)}
            active={!!activeQuote && it.quote === activeQuote}
          />
        ))}
      </ol>
    </div>
  );
}

function FeedbackRow({
  item,
  dotClass,
  essay,
  onClick,
  active,
}: {
  item: FeedbackItem;
  dotClass: string;
  essay: string;
  onClick: () => void;
  active: boolean;
}) {
  const canLink = quoteIsInEssay(essay, item.quote);
  const content = (
    <>
      <span
        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`}
      />
      <span className="text-slate-800">
        {item.text}
        {canLink && (
          <span className="ml-1 text-xs text-slate-400">
            ↩ show in essay
          </span>
        )}
      </span>
    </>
  );

  if (!canLink) {
    return (
      <li className="flex gap-3 px-2 py-1.5 text-sm leading-relaxed">
        {content}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full gap-3 rounded-md px-2 py-1.5 text-left text-sm leading-relaxed transition hover:bg-slate-50 ${
          active ? "bg-yellow-50 ring-1 ring-yellow-300" : ""
        }`}
      >
        {content}
      </button>
    </li>
  );
}
