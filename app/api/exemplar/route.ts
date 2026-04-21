import { NextRequest, NextResponse } from "next/server";
import {
  ExemplarError,
  generateExemplar,
} from "@/lib/exemplar/generator";
import { resolveApiKey } from "@/lib/ai/providers";
import type { ProviderId } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 45;

const VALID_PROVIDERS: ProviderId[] = ["anthropic", "openai", "gemini"];

interface Body {
  question?: string;
  apiKey?: string;
  provider?: ProviderId;
  grade?: {
    score: number;
    level: 1 | 2 | 3 | 4;
    missing_elements: string[];
    errors: string[];
    weaknesses: { text: string }[];
  };
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const question = (body.question ?? "").toString().trim();
  if (!question) {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 },
    );
  }
  if (!body.grade) {
    return NextResponse.json(
      { error: "Grade summary is required." },
      { status: 400 },
    );
  }

  const provider: ProviderId = VALID_PROVIDERS.includes(
    body.provider as ProviderId,
  )
    ? (body.provider as ProviderId)
    : "anthropic";

  const apiKey = resolveApiKey(provider, body.apiKey);
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `No API key available for provider "${provider}".`,
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateExemplar({
      apiKey,
      provider,
      question,
      grade: {
        score: body.grade.score,
        level: body.grade.level,
        missing_elements: body.grade.missing_elements ?? [],
        errors: body.grade.errors ?? [],
        weaknesses: body.grade.weaknesses ?? [],
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ExemplarError) {
      return NextResponse.json(
        {
          error: err.message,
          details:
            process.env.NODE_ENV === "development" ? err.cause : undefined,
        },
        { status: 502 },
      );
    }
    console.error("Exemplar error:", err);
    return NextResponse.json({ error: "Exemplar failed." }, { status: 500 });
  }
}
