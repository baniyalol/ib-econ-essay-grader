import type { GradeResult, MissingElement } from "@/lib/types";

const MISSING_LABEL: Record<MissingElement, string> = {
  definitions: "Precise definitions of key economic terms",
  application: "Application to a specific real-world context",
  diagram_reasoning: "Correct diagram logic (axes / curves / shift / equilibrium)",
  chain_of_reasoning: "Multi-step chains of reasoning (≥ 3 causal steps)",
  real_world_example: "Specific real-world example (country / firm / year / data)",
  evaluation: "Substantive, prioritised evaluation with supported judgment",
};

export function JustificationCard({ result }: { result: GradeResult }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Band justification
      </h3>
      <p className="text-sm leading-relaxed text-slate-800">
        {result.justification}
      </p>
    </div>
  );
}

export function MissingElementsCard({ result }: { result: GradeResult }) {
  const missing = new Set(result.missing_elements);
  const all = Object.keys(MISSING_LABEL) as MissingElement[];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Rubric checklist
      </h3>
      <ul className="space-y-2 text-sm">
        {all.map((k) => {
          const isMissing = missing.has(k);
          return (
            <li key={k} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  isMissing ? "bg-red-500" : "bg-emerald-500"
                }`}
              >
                {isMissing ? "✕" : "✓"}
              </span>
              <span
                className={
                  isMissing ? "text-slate-900" : "text-slate-500 line-through"
                }
              >
                {MISSING_LABEL[k]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ErrorsCard({ result }: { result: GradeResult }) {
  if (!result.errors || result.errors.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Conceptual errors
        </h3>
        <p className="text-sm text-emerald-900">
          No major conceptual errors detected. 
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-700">
        Conceptual errors detected
      </h3>
      <ul className="space-y-2 text-sm text-red-900">
        {result.errors.map((e, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
            <span>{e}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-red-700">
        Conceptual errors can cap your score (major errors cap at 5/10).
      </p>
    </div>
  );
}
