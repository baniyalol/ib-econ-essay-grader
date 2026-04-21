import { NextRequest, NextResponse } from "next/server";
import { gradeEssay, GradingError } from "@/lib/grading/grader";
import { resolveApiKey } from "@/lib/ai/providers";
import type { ProviderId } from "@/lib/ai/types";
import type { GradeErrorResponse, GradeRequestBody } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_PROVIDERS: ProviderId[] = ["anthropic", "openai", "gemini"];

export async function POST(req: NextRequest) {
  let body: Partial<GradeRequestBody>;
  try {
    body = (await req.json()) as Partial<GradeRequestBody>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const question = (body.question ?? "").toString();
  const essay = (body.essay ?? "").toString();
  const userApiKey = body.apiKey?.toString().trim();
  const questionType = body.questionType ?? "10-mark";
  const deepAnalysis = !!body.deepAnalysis;
  const provider: ProviderId = VALID_PROVIDERS.includes(
    body.provider as ProviderId,
  )
    ? (body.provider as ProviderId)
    : "anthropic";

  const apiKey = resolveApiKey(provider, userApiKey);
  if (!apiKey) {
    return json(
      {
        error: `No API key available for provider "${provider}". Either provide your own key in the UI or set the server env var.`,
      },
      400,
    );
  }

  try {
    const result = await gradeEssay({
      question,
      essay,
      apiKey,
      provider,
      questionType,
      deepAnalysis,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof GradingError) {
      const status =
        err.kind === "input"
          ? 400
          : err.kind === "validation" || err.kind === "parse"
            ? 502
            : 500;
      return json(
        {
          error: err.message,
          details:
            process.env.NODE_ENV === "development" ? err.cause : undefined,
        },
        status,
      );
    }
    console.error("Unhandled grading error:", err);
    return json({ error: "Internal server error." }, 500);
  }
}

export async function GET() {
  return json({ error: "Use POST /api/grade." }, 405);
}

function json(body: GradeErrorResponse, status: number) {
  return NextResponse.json(body, { status });
}
