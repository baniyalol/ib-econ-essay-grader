"use client";

import { useRef, useState } from "react";
import type { GradeResult } from "@/lib/types";
import type { ProviderId } from "@/lib/ai/types";
import { ProviderPicker } from "./ProviderPicker";

interface FormHandoff {
  apiKey?: string;
  provider: ProviderId;
}

interface EssayFormProps {
  onResult: (r: GradeResult, handoff: FormHandoff) => void;
  onError: (e: string) => void;
  onLoadingChange: (loading: boolean) => void;
  loading: boolean;
}

export function EssayForm({
  onResult,
  onError,
  onLoadingChange,
  loading,
}: EssayFormProps) {
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError("");
    if (!question.trim() || !essay.trim()) {
      onError("Please fill in both the question and the essay.");
      return;
    }
    if (useOwnKey && !apiKey.trim()) {
      onError("You chose to use your own key — please paste it in.");
      return;
    }

    onLoadingChange(true);
    try {
      const userKey = useOwnKey ? apiKey.trim() : undefined;
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          essay,
          questionType: "10-mark",
          apiKey: userKey,
          provider,
          deepAnalysis,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data?.error ?? `Request failed with status ${res.status}`);
        return;
      }
      onResult(data as GradeResult, { apiKey: userKey, provider });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Network error.");
    } finally {
      onLoadingChange(false);
    }
  }

  async function handleFile(file: File) {
    onError("");
    setExtracting(true);
    setUploadedName(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        onError(data?.error ?? "Upload failed.");
        return;
      }
      setEssay(data.text as string);
      setUploadedName(data.filename as string);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Question prompt
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder='e.g. "Discuss the view that an increase in indirect taxes on demerit goods is the most effective way of reducing their consumption." [10]'
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-800">
              Your essay
            </label>
            <span className="text-xs text-slate-500">{wordCount} words</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-dashed px-4 py-3 text-xs transition ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2 text-slate-600">
              <span>
                {extracting
                  ? "Reading file…"
                  : uploadedName
                    ? `Loaded: ${uploadedName}`
                    : "Drop a PDF / .docx / .txt here, or paste your essay below."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Choose file
              </button>
            </div>
          </div>

          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={14}
            placeholder="Paste your full essay response here. Include any description of diagrams you drew (axes, curves, equilibrium points, shifts)."
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-serif text-[15px] leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={deepAnalysis}
              onChange={(e) => setDeepAnalysis(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              Deep Analysis (tiebreaker second read)
              <span className="ml-1 block text-xs font-normal text-slate-500">
                Runs the essay through the grader twice and flags any
                disagreement larger than 2 marks. Doubles the API cost.
              </span>
            </span>
          </label>
        </div>

        <ProviderPicker
          provider={provider}
          setProvider={setProvider}
          useOwnKey={useOwnKey}
          setUseOwnKey={setUseOwnKey}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />

        <button
          type="submit"
          disabled={loading || extracting}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading
            ? deepAnalysis
              ? "Running two independent reads…"
              : "Grading your essay…"
            : "Grade my essay"}
        </button>
      </div>
    </form>
  );
}
