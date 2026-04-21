/**
 * Deterministic pre-analysis of the student essay. Runs BEFORE the LLM call
 * at zero cost. Produces structured signals that are fed into the grading
 * prompt so Claude doesn't have to rediscover them — this reduces output
 * tokens and improves consistency.
 *
 * These signals are hints, not hard gates. The LLM still has final say,
 * but the prompt tells it to trust these unless it sees clear evidence
 * otherwise.
 */

const COMMAND_TERMS = [
  "discuss",
  "evaluate",
  "examine",
  "to what extent",
  "justify",
  "explain",
  "analyse",
  "analyze",
  "compare",
  "contrast",
  "assess",
];

const DIAGRAM_KEYWORDS = [
  "diagram",
  "figure",
  "graph",
  "curve",
  "axis",
  "axes",
  "y-axis",
  "x-axis",
  "equilibrium",
  "shift",
  "shifts",
  "shifted",
  "supply curve",
  "demand curve",
  "price floor",
  "price ceiling",
  "s1",
  "s2",
  "d1",
  "d2",
  "p1",
  "p2",
  "q1",
  "q2",
  "ppf",
  "lras",
  "sras",
  "ad",
  "as",
  "mpc",
  "mpb",
  "msb",
  "msc",
  "mc",
  "mr",
];

/**
 * Rough regex for "specific real-world example" signals. Matches:
 *  - A year (2015, 2023, etc.)
 *  - A percentage (3.5%, 12%)
 *  - A currency amount ($2bn, £500m, €1.2 billion)
 *  - Common country/region names (non-exhaustive but good enough as a hint)
 */
const YEAR_RE = /\b(19|20)\d{2}\b/;
const PERCENT_RE = /\b\d+(\.\d+)?\s?%/;
const MONEY_RE = /(\$|£|€|¥|₹)\s?\d|\b\d+\s?(bn|billion|million|mn|trillion|tn)\b/i;

const COUNTRY_HINTS = [
  "UK","United Kingdom","US","USA","United States","EU","India","China",
  "Germany","France","Japan","Brazil","Australia","Canada","Mexico","Russia",
  "Nigeria","South Africa","Indonesia","Pakistan","Bangladesh","Vietnam",
  "Singapore","Thailand","Turkey","Saudi Arabia","UAE","Egypt","Argentina",
  "Chile","Colombia","Peru","Kenya","Ethiopia","Ghana","Morocco","Poland",
  "Netherlands","Spain","Italy","Sweden","Norway","Switzerland","Greece",
  "Ireland","Portugal","Denmark","Finland","New Zealand","Hong Kong","Taiwan",
];

/** Very common econ definition markers: "is defined as", "refers to", "can be defined", colon-form. */
const DEFINITION_RE =
  /\b(is defined as|are defined as|refers to|refer to|can be defined|is a type of|is a|are a|means|is the)\b/i;

export interface PreCheckSignals {
  wordCount: number;
  commandTermDetected: string | null;
  diagramSignalCount: number;
  likelyHasDiagram: boolean;
  namedEntityCount: number;
  likelyHasSpecificExample: boolean;
  definitionMarkerCount: number;
  likelyHasDefinitions: boolean;
  paragraphCount: number;
  hasEvaluationLanguage: boolean;
}

const EVAL_PHRASES = [
  "however",
  "on the other hand",
  "in the short run",
  "in the long run",
  "price elasticity",
  "depends on",
  "assumption",
  "ceteris paribus",
  "trade-off",
  "tradeoff",
  "magnitude",
  "stakeholder",
  "in conclusion",
  "overall",
  "judgment",
  "judgement",
  "it could be argued",
  "nonetheless",
  "although",
  "whereas",
];

export function runPreChecks(args: {
  question: string;
  essay: string;
}): PreCheckSignals {
  const essay = args.essay ?? "";
  const question = args.question ?? "";
  const lower = essay.toLowerCase();
  const qLower = question.toLowerCase();

  const wordCount = essay.split(/\s+/).filter(Boolean).length;

  let commandTermDetected: string | null = null;
  for (const t of COMMAND_TERMS) {
    if (qLower.includes(t)) {
      commandTermDetected = t;
      break;
    }
  }

  let diagramSignalCount = 0;
  for (const k of DIAGRAM_KEYWORDS) {
    const re = new RegExp(`\\b${escapeRegex(k)}\\b`, "i");
    if (re.test(lower)) diagramSignalCount++;
  }

  let namedEntityCount = 0;
  if (YEAR_RE.test(essay)) namedEntityCount++;
  if (PERCENT_RE.test(essay)) namedEntityCount++;
  if (MONEY_RE.test(essay)) namedEntityCount++;
  for (const c of COUNTRY_HINTS) {
    const re = new RegExp(`\\b${escapeRegex(c)}\\b`);
    if (re.test(essay)) {
      namedEntityCount++;
      break;
    }
  }

  const definitionMarkerCount = (essay.match(new RegExp(DEFINITION_RE, "gi")) ?? [])
    .length;

  const paragraphCount = essay.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

  const hasEvaluationLanguage = EVAL_PHRASES.some((p) => lower.includes(p));

  return {
    wordCount,
    commandTermDetected,
    diagramSignalCount,
    likelyHasDiagram: diagramSignalCount >= 4,
    namedEntityCount,
    likelyHasSpecificExample: namedEntityCount >= 1,
    definitionMarkerCount,
    likelyHasDefinitions: definitionMarkerCount >= 1,
    paragraphCount,
    hasEvaluationLanguage,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function signalsToPromptBlock(sig: PreCheckSignals): string {
  return `PRE-ANALYSIS SIGNALS (deterministic, computed from the essay text — trust these unless you see clear contrary evidence):
- word_count: ${sig.wordCount}
- paragraph_count: ${sig.paragraphCount}
- command_term_in_question: ${sig.commandTermDetected ?? "none detected"}
- diagram_signal_count: ${sig.diagramSignalCount} (keywords like axes/curve/equilibrium/shift)
- likely_has_labelled_diagram_description: ${sig.likelyHasDiagram}
- named_entity_count: ${sig.namedEntityCount} (years, %, $ amounts, country names)
- likely_has_specific_real_world_example: ${sig.likelyHasSpecificExample}
- definition_marker_count: ${sig.definitionMarkerCount} ("is defined as", "refers to", etc.)
- likely_has_definitions: ${sig.likelyHasDefinitions}
- has_evaluation_language: ${sig.hasEvaluationLanguage}`;
}
