import type { ProviderId } from "./ai/types";

export type { ProviderId } from "./ai/types";

export type QuestionType = "10-mark" | "15-mark";

export type AOKey = "AO1" | "AO2" | "AO3" | "AO4";

export interface AOBreakdown {
  AO1: number;
  AO2: number;
  AO3: number;
  AO4: number;
}

/**
 * A single piece of feedback, optionally tied to a verbatim quote from the
 * essay so the UI can highlight / scroll to it.
 */
export interface FeedbackItem {
  text: string;
  quote?: string;
}

export type FiveFeedbackItems = [
  FeedbackItem,
  FeedbackItem,
  FeedbackItem,
  FeedbackItem,
  FeedbackItem,
];

export type MissingElement =
  | "definitions"
  | "application"
  | "diagram_reasoning"
  | "chain_of_reasoning"
  | "real_world_example"
  | "evaluation";

export interface GradeResult {
  score: number;
  level: 1 | 2 | 3 | 4;
  level_descriptor: string;
  justification: string;
  confidence: number;
  ao_scores: AOBreakdown;
  ao_max: AOBreakdown;
  ao_commentary: Record<AOKey, string>;
  strengths: FiveFeedbackItems;
  weaknesses: FiveFeedbackItems;
  improvements: FiveFeedbackItems;
  overall_feedback: string;
  missing_elements: MissingElement[];
  errors: string[];
  command_term?: string;
  diagram_detected: boolean;
  real_world_example_detected: boolean;
  word_count: number;
  question_type: QuestionType;
  /** Present only when Deep Analysis (tiebreaker) mode was used. */
  tiebreaker?: {
    second_score: number;
    second_level: 1 | 2 | 3 | 4;
    score_delta: number;
    agreement: "strong" | "moderate" | "weak";
  };
  /** Preserved so share URLs can re-render the annotated essay. */
  question?: string;
  essay?: string;
}

export interface GradeRequestBody {
  question: string;
  essay: string;
  apiKey?: string;
  provider?: ProviderId;
  questionType?: QuestionType;
  deepAnalysis?: boolean;
}

export interface ExemplarResponse {
  /** What a Level 4 (9–10) answer to *this specific* question would contain. */
  exemplar_outline: {
    introduction: string;
    definitions: string[];
    theory_and_diagram: string;
    application_example: string;
    evaluation_points: string[];
    judgment: string;
  };
  /** What this student specifically missed that a L4 answer would have done. */
  what_you_missed: string[];
}

export interface GradeErrorResponse {
  error: string;
  details?: unknown;
}
