"use client";

import type { ProviderId } from "@/lib/ai/types";

interface ProviderMeta {
  id: ProviderId;
  label: string;
  helper: string;
  keyPattern: string;
  keyPlaceholder: string;
  consoleUrl: string;
}

export const PROVIDER_META: ProviderMeta[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    helper:
      "Recommended. The rubric and caps are calibrated against Claude. Most accurate grading.",
    keyPattern: "sk-ant-",
    keyPlaceholder: "sk-ant-...",
    consoleUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    helper: "Works well. Defaults to gpt-4o (strict JSON mode).",
    keyPattern: "sk-",
    keyPlaceholder: "sk-...",
    consoleUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    helper:
      "Cheapest / free tier friendly. Defaults to gemini-2.0-flash (JSON mime type).",
    keyPattern: "",
    keyPlaceholder: "AIza...",
    consoleUrl: "https://aistudio.google.com/apikey",
  },
];

interface Props {
  provider: ProviderId;
  setProvider: (p: ProviderId) => void;
  useOwnKey: boolean;
  setUseOwnKey: (v: boolean) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
}

export function ProviderPicker({
  provider,
  setProvider,
  useOwnKey,
  setUseOwnKey,
  apiKey,
  setApiKey,
}: Props) {
  const meta = PROVIDER_META.find((p) => p.id === provider)!;

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-800">AI provider</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {PROVIDER_META.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProvider(p.id)}
            className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
              provider === p.id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">{meta.helper}</p>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          checked={useOwnKey}
          onChange={(e) => setUseOwnKey(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Use my own {meta.label} API key
      </label>

      {useOwnKey && (
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={meta.keyPlaceholder}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <a
            href={meta.consoleUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Get a {meta.label} key →
          </a>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Keys are sent directly to the grading endpoint for this request only.
        Never stored, never logged.
      </p>
    </div>
  );
}
