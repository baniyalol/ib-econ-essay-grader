import { getProvider } from "../ai/providers";
import { LLMError, type ProviderId } from "../ai/types";
import type {
  AOKey,
  FiveFeedbackItems,
  GradeResult,
  MissingElement,
  QuestionType,
} from "../types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { getRubric } from "./rubric";
import {
  buildGradeSchema,
  extractJsonObject,
  type RawGrade,
} from "./validator";
import { runPreChecks } from "./preChecks";
import { cacheGet, cacheKey, cacheSet } from "./cache";

export interface GradeEssayArgs {
  question: string;
  essay: string;
  apiKey: string;
  provider: ProviderId;
  questionType?: QuestionType;
  /**
   * If true, run a second pass and return a tiebreaker block. Doubles cost.
   * Used for the "Deep Analysis" opt-in.
   */
  deepAnalysis?: boolean;
}

export class GradingError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "validation"
      | "ai"
      | "parse"
      | "input",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GradingError";
  }
}

const MAX_ESSAY_CHARS = Number(process.env.MAX_ESSAY_CHARS || 12000);

export async function gradeEssay(
  args: GradeEssayArgs,
): Promise<GradeResult> {
  const questionType: QuestionType = args.questionType ?? "10-mark";
  const question = args.question?.trim() ?? "";
  const essay = args.essay?.trim() ?? "";
  const deepAnalysis = !!args.deepAnalysis;

  if (!question) {
    throw new GradingError("Question prompt is required.", "input");
  }
  if (!essay) {
    throw new GradingError("Essay is required.", "input");
  }
  if (essay.length > MAX_ESSAY_CHARS) {
    throw new GradingError(
      `Essay exceeds ${MAX_ESSAY_CHARS} characters.`,
      "input",
    );
  }
  if (essay.split(/\s+/).filter(Boolean).length < 50) {
    throw new GradingError(
      "Essay is too short to grade (minimum 50 words).",
      "input",
    );
  }

  const key = cacheKey({
    question,
    essay,
    deepAnalysis,
    questionType,
    provider: args.provider,
  });
  const cached = cacheGet(key);
  if (cached) return cached;

  const rubric = getRubric(questionType);
  const systemPrompt = buildSystemPrompt(rubric);
  const signals = runPreChecks({ question, essay });
  const userPrompt = buildUserPrompt({ question, essay, signals });
  const schema = buildGradeSchema(rubric);
  const provider = getProvider(args.provider);

  const primary = await gradeOnce({
    provider,
    apiKey: args.apiKey,
    systemPrompt,
    userPrompt,
    temperature: 0,
    schema,
    maxAttempts: 2,
  });

  let tiebreaker: GradeResult["tiebreaker"] | undefined;
  if (deepAnalysis) {
    // Single attempt on the tiebreaker pass so we can't blow past the 60s
    // Vercel function timeout. If the second read fails we return the primary
    // grade without a tiebreaker block rather than failing the whole request.
    let second;
    try {
      second = await gradeOnce({
        provider,
        apiKey: args.apiKey,
        systemPrompt,
        userPrompt: `${userPrompt}\n\nThis is an independent second read. Grade from scratch. Do not try to match any previous score.`,
        temperature: 0.1,
        schema,
        maxAttempts: 1,
      });
    } catch (err) {
      console.warn("Deep Analysis second pass failed, returning primary only:", err);
      second = null;
    }
    if (second) {
      const delta = Math.abs(primary.score - second.score);
      tiebreaker = {
        second_score: second.score,
        second_level: second.level,
        score_delta: delta,
        agreement: delta === 0 ? "strong" : delta <= 2 ? "moderate" : "weak",
      };
    }
  }

  const result = toGradeResult({
    raw: primary,
    rubric,
    essay,
    question,
    questionType,
    tiebreaker,
  });
  cacheSet(key, result);
  return result;
}

async function gradeOnce(args: {
  provider: ReturnType<typeof getProvider>;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  schema: ReturnType<typeof buildGradeSchema>;
  maxAttempts?: number;
}): Promise<RawGrade> {
  const maxAttempts = args.maxAttempts ?? 2;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let raw: string;
    try {
      raw = await args.provider.call({
        apiKey: args.apiKey,
        systemPrompt: args.systemPrompt,
        userPrompt:
          attempt === 1
            ? args.userPrompt
            : `${args.userPrompt}\n\nREMINDER: Return ONLY a single JSON object matching the schema. No prose, no markdown fences.`,
        temperature: args.temperature,
        forceJson: true,
      });
    } catch (err) {
      if (err instanceof LLMError) {
        throw new GradingError(err.message, "ai", err);
      }
      throw err;
    }

    const jsonText = extractJsonObject(raw);
    if (!jsonText) {
      lastErr = new GradingError(
        "Model response did not contain JSON.",
        "parse",
      );
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      lastErr = new GradingError("Model JSON was malformed.", "parse", err);
      continue;
    }

    const result = args.schema.safeParse(parsed);
    if (!result.success) {
      lastErr = new GradingError(
        "Model response failed rubric validation.",
        "validation",
        result.error.issues,
      );
      continue;
    }

    return result.data;
  }

  if (lastErr instanceof GradingError) throw lastErr;
  throw new GradingError("Grading failed after retries.", "ai", lastErr);
}

function toGradeResult(args: {
  raw: RawGrade;
  rubric: ReturnType<typeof getRubric>;
  essay: string;
  question: string;
  questionType: QuestionType;
  tiebreaker?: GradeResult["tiebreaker"];
}): GradeResult {
  const { raw, rubric, essay, question, questionType, tiebreaker } = args;
  const ao_commentary = raw.ao_commentary as Record<AOKey, string>;
  const missing_elements = raw.missing_elements as MissingElement[];
  return {
    score: raw.score,
    level: raw.level,
    level_descriptor: raw.level_descriptor,
    justification: raw.justification,
    confidence: raw.confidence,
    ao_scores: raw.ao_scores,
    ao_max: rubric.aoMax,
    ao_commentary,
    strengths: raw.strengths as FiveFeedbackItems,
    weaknesses: raw.weaknesses as FiveFeedbackItems,
    improvements: raw.improvements as FiveFeedbackItems,
    overall_feedback: raw.overall_feedback,
    missing_elements,
    errors: raw.errors,
    question_type: questionType,
    command_term: raw.command_term,
    diagram_detected: raw.diagram_detected,
    real_world_example_detected: raw.real_world_example_detected,
    word_count: essay.split(/\s+/).filter(Boolean).length,
    tiebreaker,
    question,
    essay,
  };
}
