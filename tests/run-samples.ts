/**
 * Run all sample essays through a locally-running grader and print a table
 * comparing expected vs predicted scores.
 *
 * Prereqs:
 *   1) npm run dev  (in another terminal)
 *   2) .env.local has ANTHROPIC_API_KEY
 *
 * Then: npx tsx tests/run-samples.ts
 */

import { SAMPLES } from "./sample-essays";

const BASE = process.env.GRADER_URL || "http://localhost:3000";

async function main() {
  const rows: string[] = [];
  rows.push(
    ["id", "expected", "predicted", "level_exp", "level_got", "pass"].join(
      "\t",
    ),
  );

  for (const s of SAMPLES) {
    const res = await fetch(`${BASE}/api/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: s.question,
        essay: s.essay,
        questionType: "10-mark",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[${s.id}] error:`, data);
      continue;
    }
    const inRange =
      data.score >= s.expectedScoreRange[0] &&
      data.score <= s.expectedScoreRange[1];
    rows.push(
      [
        s.id,
        `${s.expectedScoreRange[0]}-${s.expectedScoreRange[1]}`,
        data.score,
        s.expectedLevel,
        data.level,
        inRange ? "PASS" : "FAIL",
      ].join("\t"),
    );
  }

  console.log(rows.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
