import { z } from "zod";
import { getProvider } from "../ai/providers";
import { LLMError, type ProviderId } from "../ai/types";
import type { ExemplarResponse } from "../types";
import { extractJsonObject } from "../grading/validator";

/**
 * Generates a "what a Level 4 answer would have looked like" outline tailored
 * to the specific question AND to what the student actually missed.
 *
 * Uses the same provider as grading by default. Override per-provider with
 * ANTHROPIC_EXEMPLAR_MODEL / OPENAI_EXEMPLAR_MODEL / GEMINI_EXEMPLAR_MODEL if
 * you want a cheaper model for the outline.
 */

const exemplarSchema = z.object({
  exemplar_outline: z.object({
    introduction: z.string().min(1),
    definitions: z.array(z.string().min(1)).min(1),
    theory_and_diagram: z.string().min(1),
    application_example: z.string().min(1),
    evaluation_points: z.array(z.string().min(1)).min(2),
    judgment: z.string().min(1),
  }),
  what_you_missed: z.array(z.string().min(1)).min(1),
});

export class ExemplarError extends Error {
  constructor(
    message: string,
    public readonly kind: "ai" | "parse" | "validation",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ExemplarError";
  }
}

export interface ExemplarGradeSummary {
  score: number;
  level: 1 | 2 | 3 | 4;
  missing_elements: string[];
  errors: string[];
  weaknesses: { text: string }[];
}

function exemplarModelFor(provider: ProviderId): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_EXEMPLAR_MODEL;
    case "openai":
      return process.env.OPENAI_EXEMPLAR_MODEL;
    case "gemini":
      return process.env.GEMINI_EXEMPLAR_MODEL;
  }
}

export async function generateExemplar(args: {
  apiKey: string;
  provider: ProviderId;
  question: string;
  grade: ExemplarGradeSummary;
}): Promise<ExemplarResponse> {
  const provider = getProvider(args.provider);

  const system = `You are a senior IB Economics examiner. You produce concise Level 4 (9–10 mark) exemplar outlines for Paper 1 Part (b) 10-mark questions.

You do NOT write a full essay. You write a STRUCTURED OUTLINE a student could use to rewrite their answer. The outline must be tailored to the specific question and to what this student missed. Real-world examples must be specific (named country/firm/year/data). Evaluation must be balanced and prioritised (short vs long run, PED, stakeholders, assumptions, alternatives).

Return ONLY a JSON object with this schema:

{
  "exemplar_outline": {
    "introduction": string,
    "definitions": [string, ...],
    "theory_and_diagram": string,
    "application_example": string,
    "evaluation_points": [string, ...],
    "judgment": string
  },
  "what_you_missed": [string, ...]
}

No prose, no markdown fences, JSON only.`;

  const user = `QUESTION:
${args.question.trim()}

THIS STUDENT'S GRADE: ${args.grade.score}/10 (Level ${args.grade.level}).
MISSING ELEMENTS FLAGGED: ${args.grade.missing_elements.join(", ") || "none"}.
CONCEPTUAL ERRORS FLAGGED: ${
    args.grade.errors.length > 0
      ? args.grade.errors.map((e) => `"${e}"`).join("; ")
      : "none"
  }.
TOP WEAKNESSES: ${args.grade.weaknesses.map((w) => w.text).slice(0, 3).join(" | ")}

Produce the Level 4 exemplar outline for this exact question, and list what THIS student specifically needs to add. Return ONLY the JSON.`;

  let raw: string;
  try {
    raw = await provider.call({
      apiKey: args.apiKey,
      model: exemplarModelFor(args.provider),
      systemPrompt: system,
      userPrompt: user,
      temperature: 0.2,
      maxTokens: 1800,
      forceJson: true,
    });
  } catch (err) {
    if (err instanceof LLMError) {
      throw new ExemplarError(err.message, "ai", err);
    }
    throw err;
  }

  const json = extractJsonObject(raw);
  if (!json) {
    throw new ExemplarError(
      `Model did not return JSON. Raw response (first 500 chars): ${raw.slice(0, 500)}`,
      "parse",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new ExemplarError(
      `Malformed exemplar JSON. First 500 chars: ${json.slice(0, 500)}`,
      "parse",
      err,
    );
  }
  const result = exemplarSchema.safeParse(parsed);
  if (!result.success) {
    throw new ExemplarError(
      "Exemplar failed schema validation.",
      "validation",
      result.error.issues,
    );
  }
  return result.data;
}
