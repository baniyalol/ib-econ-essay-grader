import type { AOKey, GradeResult } from "@/lib/types";

const AO_META: Record<AOKey, { title: string; subtitle: string }> = {
  AO1: { title: "AO1", subtitle: "Knowledge & definitions" },
  AO2: { title: "AO2", subtitle: "Real-world application" },
  AO3: { title: "AO3", subtitle: "Analysis & diagram" },
  AO4: { title: "AO4", subtitle: "Evaluation & judgment" },
};

export function AOBreakdown({ result }: { result: GradeResult }) {
  const keys: AOKey[] = ["AO1", "AO2", "AO3", "AO4"];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Assessment Objectives
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {keys.map((k) => {
          const score = result.ao_scores[k];
          const max = result.ao_max[k];
          const pct = max === 0 ? 0 : (score / max) * 100;
          return (
            <div
              key={k}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {AO_META[k].title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {AO_META[k].subtitle}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900">
                    {score}
                  </span>
                  <span className="text-sm text-slate-500"> / {max}</span>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {result.ao_commentary[k]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
