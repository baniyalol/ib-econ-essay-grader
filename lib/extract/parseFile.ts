/**
 * Turn an uploaded PDF or .docx into plain text.
 * Kept in a single module so the API route stays thin.
 */

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractedDocument {
  text: string;
  wordCount: number;
  kind: "pdf" | "docx" | "text";
  filename: string;
}

export class ExtractError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ExtractError";
  }
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB hard cap
const ACCEPTED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function extractFromFile(
  file: File,
): Promise<ExtractedDocument> {
  if (file.size > MAX_BYTES) {
    throw new ExtractError("File exceeds 5 MB limit.", 413);
  }
  const name = file.name || "upload";
  const type = file.type || "";
  const nameLower = name.toLowerCase();

  const isPdf =
    type === "application/pdf" || nameLower.endsWith(".pdf");
  const isDocx =
    type.includes("wordprocessingml") || nameLower.endsWith(".docx");
  const isText = type === "text/plain" || nameLower.endsWith(".txt");

  if (!isPdf && !isDocx && !isText && !ACCEPTED.includes(type)) {
    throw new ExtractError(
      "Unsupported file type. Upload a PDF, .docx, or .txt.",
      415,
    );
  }

  let text = "";
  let kind: ExtractedDocument["kind"] = "text";

  if (isPdf) {
    kind = "pdf";
    const buf = new Uint8Array(await file.arrayBuffer());
    try {
      const pdf = await getDocumentProxy(buf);
      const { text: pages } = await extractText(pdf, { mergePages: true });
      text = Array.isArray(pages) ? pages.join("\n\n") : String(pages ?? "");
    } catch (err) {
      throw new ExtractError(
        "Could not read the PDF. It may be scanned/image-only or corrupted.",
        422,
      );
    }
  } else if (isDocx) {
    kind = "docx";
    const buf = Buffer.from(await file.arrayBuffer());
    try {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      text = value;
    } catch (err) {
      throw new ExtractError("Could not read the .docx file.", 422);
    }
  } else {
    kind = "text";
    text = await file.text();
  }

  text = normalise(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 20) {
    throw new ExtractError(
      "Could not find enough readable text in the file (is it a scanned image?).",
      422,
    );
  }

  return { text, wordCount, kind, filename: name };
}

/** Clean up common PDF/docx extraction artefacts: excessive blank lines, soft hyphens, etc. */
function normalise(raw: string): string {
  return raw
    .replace(/\u00AD/g, "") // soft hyphen
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
