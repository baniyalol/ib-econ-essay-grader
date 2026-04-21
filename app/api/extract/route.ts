import { NextRequest, NextResponse } from "next/server";
import { extractFromFile, ExtractError } from "@/lib/extract/parseFile";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart/form-data with a 'file' field." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field." },
      { status: 400 },
    );
  }

  try {
    const extracted = await extractFromFile(file);
    return NextResponse.json(extracted, { status: 200 });
  } catch (err) {
    if (err instanceof ExtractError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Extract error:", err);
    return NextResponse.json(
      { error: "Failed to read file." },
      { status: 500 },
    );
  }
}
