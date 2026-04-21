"use client";

import { useState } from "react";
import type { GradeResult } from "@/lib/types";
import { encodeShare } from "@/lib/share/encode";

export function ScoreHeader({ result }: { result: GradeResult }) {
  const pct = Math.round((result.score / 10) * 100);
  const color =
    result.level === 4
      ? "bg-emerald-600"
      : result.level === 3
        ? "bg-blue-600"
        : result.level === 2
          ? "bg-amber-500"
          : "bg-red-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            IB Economics · {result.question_type}
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-5xl font-bold text-slate-900">
              {result.score}
            </span>
            <span className="text-xl text-slate-500">/ 10</span>
            <span
              className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${color}`}
            >
              Level {result.level}
            </span>
            <ConfidenceBadge confidence={result.confidence} />
          </div>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            {result.level_descriptor}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-600 md:items-end">
          <InfoRow label="Command term" value={result.command_term ?? "—"} />
          <InfoRow
            label="Diagram detected"
            value={result.diagram_detected ? "Yes" : "No"}
            ok={result.diagram_detected}
          />
          <InfoRow
            label="Real-world example"
            value={result.real_world_example_detected ? "Yes" : "No"}
            ok={result.real_world_example_detected}
          />
          <InfoRow label="Word count" value={result.word_count.toString()} />
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
            {pct}% of full marks
          </div>
          <ShareButton result={result} />
        </div>
      </div>
      {result.tiebreaker && <TiebreakerNote tb={result.tiebreaker} primary={result.score} />}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.8
      ? "bg-slate-100 text-slate-700"
      : confidence >= 0.6
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span
      title="How confident the grader is in this score"
      className={`ml-1 rounded-md px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {pct}% confidence
    </span>
  );
}

function InfoRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500">{label}:</span>
      <span
        className={
          ok === undefined
            ? "font-medium text-slate-800"
            : ok
              ? "font-medium text-emerald-700"
              : "font-medium text-red-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function TiebreakerNote({
  tb,
  primary,
}: {
  tb: NonNullable<GradeResult["tiebreaker"]>;
  primary: number;
}) {
  const palette =
    tb.agreement === "strong"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : tb.agreement === "moderate"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-red-50 border-red-200 text-red-900";
  return (
    <div className={`mt-4 rounded-lg border p-3 text-xs ${palette}`}>
      <strong className="font-semibold">Deep Analysis · tiebreaker:</strong>{" "}
      second independent read scored{" "}
      <span className="font-mono font-semibold">{tb.second_score}/10</span>{" "}
      (Level {tb.second_level}). Δ {tb.score_delta}. Agreement:{" "}
      <span className="font-semibold">{tb.agreement}</span>.
      {tb.agreement === "weak" &&
        ` Two reads disagreed by more than 2 marks — treat ${primary}/10 as approximate and double-check the justification.`}
    </div>
  );
}

function ShareButton({ result }: { result: GradeResult }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const token = encodeShare(result);
        const url = `${window.location.origin}/g/${token}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this shareable link:", url);
        }
      }}
      className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? "Link copied!" : "Copy share link"}
    </button>
  );
}
