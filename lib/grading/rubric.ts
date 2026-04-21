/**
 * IB Economics Paper 1 Part (b) markbands — 10-mark question.
 * Source: IB Economics subject guide (first assessment 2022), Paper 1 markbands.
 *
 * This file is the single source of truth. The Claude prompt references this
 * verbatim so grading is rubric-driven, not vibes-driven. If/when we add the
 * 15-mark (Paper 1 essay or Paper 2 / Paper 3 variants) we extend this map.
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
    realWorldExample: boolean;
    evaluation: boolean;
  };
  notes: string[];
}

export const RUBRIC_10_MARK: RubricSpec = {
  questionType: "10-mark",
  maxMarks: 10,
  // Weighting reflects how IB examiners distribute marks across AOs on Part (b).
  aoMax: { AO1: 2, AO2: 2, AO3: 3, AO4: 3 },
  markbands: [
    {
      level: 1,
      range: [1, 3],
      label: "Level 1 — Basic",
      descriptor:
        "Few relevant economic terms are defined. Little understanding of the demands of the question. Few or no links to the real world. Limited, if any, relevant theory. No diagram, or a diagram that is absent of any explanation. No evaluation, or purely assertion-based.",
    },
    {
      level: 2,
      range: [4, 6],
      label: "Level 2 — Partial",
      descriptor:
        "Most relevant economic terms are defined. Some understanding of the question, though with gaps. Relevant theory is explained but not fully developed. A diagram may be present but not fully integrated or explained. Some reference to real-world examples, but thin or generic. Evaluation is asserted rather than substantiated.",
    },
    {
      level: 3,
      range: [7, 8],
      label: "Level 3 — Good",
      descriptor:
        "Relevant economic terms are clearly defined. Clear understanding of the question. Relevant economic theory is explained. At least one relevant, accurately labelled diagram is included and explained. Effective use of a specific real-world example. Evaluation is present and reasoned, though may lack depth or balance.",
    },
    {
      level: 4,
      range: [9, 10],
      label: "Level 4 — Excellent",
      descriptor:
        "All Level 3 criteria met, plus: evaluation is substantive, balanced, and prioritised (e.g., short vs long run, stakeholder impact, magnitude, assumptions, policy trade-offs). A clear, supported judgment is reached. Theory, diagram, and real-world example are fully integrated.",
    },
  ],
  required: {
    definitions: true,
    theoryExplanation: true,
    diagram: true,
    realWorldExample: true,
    evaluation: true,
  },
  notes: [
    "A missing or unlabelled diagram caps the essay at Level 2 (max 6).",
    "Absence of a specific real-world example caps the essay at Level 2 (max 6).",
    "Absence of any evaluation caps the essay at Level 2 (max 6).",
    "Only award Level 4 (9–10) when evaluation is prioritised and a supported judgment is present.",
  ],
};

export const RUBRICS: Record<QuestionType, RubricSpec> = {
  "10-mark": RUBRIC_10_MARK,
  // Placeholder so the type system knows we'll extend later. We deliberately
  // refuse to grade 15-mark until the rubric is authored.
  "15-mark": {
    questionType: "15-mark",
    maxMarks: 15,
    aoMax: { AO1: 3, AO2: 3, AO3: 4, AO4: 5 },
    markbands: [],
    required: {
      definitions: true,
      theoryExplanation: true,
      diagram: true,
      realWorldExample: true,
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
