import type { GradeResult } from "../types";

/**
 * Encode a grade result into a URL-safe string for /g/[payload] pages.
 * We trim to a compact "shareable" subset so URLs stay under ~4 KB.
 *
 * No server storage. The share link IS the state.
 */

export interface SharePayload {
  v: 1;
  q: string;
  e: string;
  r: GradeResult;
}

const MAX_URL_BYTES = 7000;

export function encodeShare(result: GradeResult): string {
  const payload: SharePayload = {
    v: 1,
    q: (result.question ?? "").slice(0, 2000),
    e: (result.essay ?? "").slice(0, 6000),
    r: { ...result, question: undefined, essay: undefined },
  };
  const json = JSON.stringify(payload);
  const b64 = base64UrlEncode(json);
  if (b64.length > MAX_URL_BYTES) {
    // Drop the essay text as a last-resort fallback; annotated view won't work
    // but score + feedback will still render.
    const slim: SharePayload = { ...payload, e: "" };
    return base64UrlEncode(JSON.stringify(slim));
  }
  return b64;
}

export function decodeShare(token: string): SharePayload | null {
  try {
    const json = base64UrlDecode(token);
    const parsed = JSON.parse(json) as SharePayload;
    if (parsed?.v !== 1 || !parsed.r) return null;
    // Re-attach question/essay onto the result for the page components.
    parsed.r.question = parsed.q;
    parsed.r.essay = parsed.e;
    return parsed;
  } catch {
    return null;
  }
}

function base64UrlEncode(s: string): string {
  const buf =
    typeof Buffer !== "undefined"
      ? Buffer.from(s, "utf8")
      : new TextEncoder().encode(s);
  const b64 =
    typeof Buffer !== "undefined"
      ? (buf as Buffer).toString("base64")
      : btoa(String.fromCharCode(...(buf as Uint8Array)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
