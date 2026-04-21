import crypto from "node:crypto";
import type { GradeResult } from "../types";

/**
 * Tiny in-memory LRU cache for (question + essay + mode) → GradeResult.
 * Lives for the lifetime of the serverless instance (warm invocations only).
 * Prevents paying for identical re-submissions during testing / calibration.
 */

const MAX_ENTRIES = 64;
const store = new Map<string, { value: GradeResult; at: number }>();

export function cacheKey(parts: {
  question: string;
  essay: string;
  deepAnalysis: boolean;
  questionType: string;
  provider: string;
}): string {
  const h = crypto.createHash("sha256");
  h.update(parts.provider);
  h.update("\u0001");
  h.update(parts.questionType);
  h.update("\u0001");
  h.update(parts.deepAnalysis ? "deep" : "std");
  h.update("\u0001");
  h.update(parts.question.trim());
  h.update("\u0001");
  h.update(parts.essay.trim());
  return h.digest("hex");
}

export function cacheGet(key: string): GradeResult | null {
  const hit = store.get(key);
  if (!hit) return null;
  hit.at = Date.now();
  return hit.value;
}

export function cacheSet(key: string, value: GradeResult): void {
  if (store.size >= MAX_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    for (const [k, v] of store) {
      if (v.at < oldestAt) {
        oldestAt = v.at;
        oldestKey = k;
      }
    }
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(key, { value, at: Date.now() });
}
