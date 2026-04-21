"use client";

import type { FeedbackItem, FiveFeedbackItems, GradeResult } from "@/lib/types";

interface Props {
  result: GradeResult;
  onQuoteClick: (quote: string | undefined) => void;
  activeQuote?: string;
}

export function FeedbackLists({ result, onQuoteClick, activeQuote }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FeedbackCard
        title="Strengths"
        items={result.strengths}
        tone="positive"
        onQuoteClick={onQuoteClick}
        activeQuote={activeQuote}
      />
      <FeedbackCard
        title="Weaknesses"
        items={result.weaknesses}
        tone="negative"
        onQuoteClick={onQuoteClick}
        activeQuote={activeQuote}
      />
      <FeedbackCard
        title="Improvements"
        items={result.improvements}
        tone="neutral"
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
  onQuoteClick,
  activeQuote,
}: {
  title: string;
  items: FiveFeedbackItems;
  tone: "positive" | "negative" | "neutral";
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
  onClick,
  active,
}: {
  item: FeedbackItem;
  dotClass: string;
  onClick: () => void;
  active: boolean;
}) {
  const clickable = !!item.quote;
  return (
    <li>
      <button
        type="button"
        disabled={!clickable}
        onClick={onClick}
        className={`flex w-full gap-3 rounded-md px-2 py-1.5 text-left text-sm leading-relaxed transition ${
          clickable
            ? "hover:bg-slate-50"
            : "cursor-default"
        } ${active ? "bg-yellow-50 ring-1 ring-yellow-300" : ""}`}
      >
        <span
          className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`}
        />
        <span className="text-slate-800">
          {item.text}
          {clickable && (
            <span className="ml-1 text-xs text-slate-400">
              ↩ show in essay
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
