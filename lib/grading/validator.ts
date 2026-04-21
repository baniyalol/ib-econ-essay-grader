import { z } from "zod";
import type { RubricSpec } from "./rubric";

const MISSING_ELEMENT_VALUES = [
  "definitions",
  "application",
  "diagram_reasoning",
  "chain_of_reasoning",
  "real_world_example",
  "evaluation",
] as const;

const feedbackItemSchema = z.object({
  text: z.string().min(1),
  quote: z.string().nullable().optional().transform((v) => v ?? undefined),
});

export function buildGradeSchema(rubric: RubricSpec) {
  const fiveItems = z
    .array(feedbackItemSchema)
    .length(5)
    .transform(
      (a) =>
        a as [
          z.infer<typeof feedbackItemSchema>,
          z.infer<typeof feedbackItemSchema>,
          z.infer<typeof feedbackItemSchema>,
          z.infer<typeof feedbackItemSchema>,
          z.infer<typeof feedbackItemSchema>,
        ],
    );

  return z
    .object({
      command_term: z.string().min(1),
      command_term_requires_evaluation: z.boolean().optional(),
      diagram_detected: z.boolean(),
      real_world_example_detected: z.boolean(),
      application_detected: z.boolean().optional(),
      internal_checklist: z
        .object({
          definitions_correct: z.boolean(),
          has_any_application: z.boolean().optional(),
          applied_to_context: z.boolean().optional(),
          chain_of_reasoning_strong: z.boolean(),
          diagram_logic_correct: z.boolean().nullable(),
          major_conceptual_errors: z.boolean(),
        })
        .optional(),
      missing_elements: z
        .array(z.enum(MISSING_ELEMENT_VALUES))
        .default([]),
      errors: z.array(z.string().min(1)).default([]),
      ao_scores: z.object({
        AO1: z.number().int().min(0).max(rubric.aoMax.AO1),
        AO2: z.number().int().min(0).max(rubric.aoMax.AO2),
        AO3: z.number().int().min(0).max(rubric.aoMax.AO3),
        AO4: z.number().int().min(0).max(rubric.aoMax.AO4),
      }),
      ao_commentary: z.object({
        AO1: z.string().min(1),
        AO2: z.string().min(1),
        AO3: z.string().min(1),
        AO4: z.string().min(1),
      }),
      score: z.number().int().min(0).max(rubric.maxMarks),
      level: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ]),
      level_descriptor: z.string().min(1),
      justification: z.string().min(1),
      confidence: z.number().min(0).max(1),
      strengths: fiveItems,
      weaknesses: fiveItems,
      improvements: fiveItems,
      overall_feedback: z.string().min(1),
    })
    .superRefine((data, ctx) => {
      const sum =
        data.ao_scores.AO1 +
        data.ao_scores.AO2 +
        data.ao_scores.AO3 +
        data.ao_scores.AO4;
      if (sum !== data.score) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["score"],
          message: `score (${data.score}) must equal sum of AO scores (${sum}).`,
        });
      }
      const band = rubric.markbands.find(
        (m) => data.score >= m.range[0] && data.score <= m.range[1],
      );
      const expectedLevel = band?.level ?? 1;
      if (data.level !== expectedLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["level"],
          message: `level (${data.level}) must match score band (expected ${expectedLevel} for score ${data.score}).`,
        });
      }
    });
}

export type RawGrade = z.infer<ReturnType<typeof buildGradeSchema>>;

/**
 * Best-effort extraction of a JSON object from a response that may include
 * stray prose, markdown fences, or trailing commentary despite the prompt.
 */
export function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) return fenced[1].trim();

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return null;
}
