/**
 * IB Economics Paper 1 Part (b) markbands — 10-mark question.
 * Source: IB Economics subject guide (first assessment 2022) + calibration notes
 * from examiner feedback.
 *
 * This file is the single source of truth. The Claude prompt references this
 * verbatim so grading is rubric-driven, not vibes-driven.
 *
 * Calibration history:
 *  - v1: AO3=3, AO4=3 with hard cap "no real-world example → 6".
 *    Result: under-scored essays 1–2 marks, penalised AO2 too harshly.
 *  - v2 (current): AO3=4, AO4=2. Application includes hypothetical /
 *    market-specific reasoning. Real-world data bonus, not requirement for L3.
 *    Evaluation weight depends on command term.
 */

import type { AOBreakdown, QuestionType } from "../types";

export interface Markband {
  level: 1 | 2 | 3 | 4;
  range: [number, number];
  label: string;
  descriptor: string;
}

export interface RubricSpec {
  questionType: QuestionType;
  maxMarks: number;
  aoMax: AOBreakdown;
  markbands: Markband[];
  required: {
    definitions: boolean;
    theoryExplanation: boolean;
    diagram: boolean;
    application: boolean;
    evaluation: boolean;
  };
  notes: string[];
}

export const RUBRIC_10_MARK: RubricSpec = {
  questionType: "10-mark",
  maxMarks: 10,
  // Weighting: analysis is the heaviest AO on 10-markers. Evaluation is
  // lighter than on 15-markers. Application ≠ "must have named country/year".
  aoMax: { AO1: 2, AO2: 2, AO3: 4, AO4: 2 },
  markbands: [
    {
      level: 1,
      range: [1, 3],
      label: "Level 1 — Basic",
      descriptor:
        "Few relevant economic terms defined; where defined they may be vague or incorrect. Little understanding of the question. Theory is asserted rather than explained. No clear chain of reasoning. No diagram, or a diagram not explained. No attempt at application.",
    },
    {
      level: 2,
      range: [4, 6],
      label: "Level 2 — Partial",
      descriptor:
        "Most key economic terms defined, sometimes imprecisely. Theory explained but not fully developed; chains of reasoning are short (one or two steps). A diagram may be present but partially integrated. Some attempt at application (even if only hypothetical or limited). Evaluation, if present, is asserted not reasoned.",
    },
    {
      level: 3,
      range: [7, 8],
      label: "Level 3 — Good",
      descriptor:
        "Key economic terms defined accurately. Relevant theory clearly explained with a multi-step chain of reasoning. At least one accurately labelled diagram (or a fully described diagram with axes, curves, shift, new equilibrium) is used to support the analysis. Some application: this can be a hypothetical scenario, market-specific reasoning (e.g. 'demand for cigarettes is inelastic…'), or a real-world example — REAL-WORLD DATA IS NOT REQUIRED at this level. For evaluative command terms (discuss/evaluate/to what extent/justify/examine/assess) there is at least some reasoned evaluation; for 'explain' command terms evaluation may be minimal.",
    },
    {
      level: 4,
      range: [9, 10],
      label: "Level 4 — Excellent",
      descriptor:
        "All Level 3 criteria met, plus: sustained multi-step analysis (≥ 3 linked causal steps), precise and fully integrated diagram, and — where the command term is evaluative — substantive evaluation reaching a supported judgment (short vs long run, PED/elasticity, stakeholder trade-offs, assumptions, alternatives). For 'explain' command terms, Level 4 is awarded for exceptional depth and precision of analysis without requiring heavy evaluation.",
    },
  ],
  required: {
    definitions: true,
    theoryExplanation: true,
    diagram: true,
    application: true, // can be hypothetical/market-specific — NOT requiring real-world data
    evaluation: false, // only required for evaluative command terms
  },
  notes: [
    "A missing or unlabelled diagram caps the essay at Level 2 (max 6).",
    "COMPLETE ABSENCE OF APPLICATION caps the essay at Level 2 (max 6). Note: hypothetical scenarios, elasticity-based reasoning, and market-specific discussion (e.g. cigarettes, petrol, sugary drinks) ALL COUNT as application even without named country/year/data.",
    "For evaluative command terms (discuss/evaluate/to what extent/justify/examine/assess): absence of any evaluation caps at Level 2. For 'explain' command terms: evaluation is NOT required and its absence is NOT a cap.",
    "Level 4 (9–10) requires sustained multi-step analysis and — for evaluative prompts — a supported judgment. For 'explain' prompts, Level 4 can be earned through analytic depth alone.",
    "A named real-world example with data earns full AO2 (2/2) but is a bonus, not a requirement. Hypothetical/market-specific application earns 1–2 AO2 depending on depth.",
  ],
};

export const RUBRICS: Record<QuestionType, RubricSpec> = {
  "10-mark": RUBRIC_10_MARK,
  "15-mark": {
    questionType: "15-mark",
    maxMarks: 15,
    aoMax: { AO1: 3, AO2: 3, AO3: 4, AO4: 5 },
    markbands: [],
    required: {
      definitions: true,
      theoryExplanation: true,
      diagram: true,
      application: true,
      evaluation: true,
    },
    notes: ["15-mark rubric not yet implemented."],
  },
};

export function getRubric(type: QuestionType): RubricSpec {
  const r = RUBRICS[type];
  if (!r || r.markbands.length === 0) {
    throw new Error(`Rubric for ${type} is not implemented yet.`);
  }
  return r;
}
