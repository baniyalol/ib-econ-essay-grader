# IB Economics Essay Grader (10-mark)

Rubric-driven AI grader for IB Economics **Paper 1 Part (b) 10-mark** essays. Uses Anthropic's Claude as the reasoning engine, but all grading is constrained by the official IB markbands — not by essay similarity.

## Why this grades accurately (and not just "nicely")

1. **Rubric is code**, not a vibe. The IB markbands (Levels 1–4) and the AO1–AO4 weightings live in `lib/grading/rubric.ts` and are injected verbatim into the system prompt.
2. **Rubric caps** (from the official markscheme): missing diagram / missing specific real-world example / missing evaluation → capped at Level 2 (max 6).
3. **Additional strict caps** (from the user brief):
   - Missing or incorrect **definitions** → capped at 6
   - No **application** to a specific context → capped at 6
   - Weak **chains of reasoning** (fewer than 3 linked causal steps) → capped at 7
   - Any **major conceptual error** → capped at 5
   - 9–10 awarded ONLY if ALL of: precise definitions, clear application, strong multi-step analysis, balanced evaluation, no major errors
4. **Internal 5-point checklist** run silently before scoring (definitions, application, chains of reasoning, diagram logic, errors) — mirrors how real examiners think.
5. **Deterministic pre-checks** (zero-API regex pass over the essay) detect diagram keywords, command terms, named entities, and definition markers *before* the LLM call, and are fed into the prompt as hints. Reduces hallucination and token usage.
6. **Deep Analysis (tiebreaker)** mode runs the essay through the grader twice with independent seeds and flags disagreements > 2 marks.
7. **Zod post-validation** rejects any response where `score ≠ sum(AO)` or `level` doesn't match the band → auto-retries.
8. **Response caching** — identical re-submissions reuse the prior result (free re-grades during calibration).
9. The model returns `confidence`, `missing_elements`, `errors`, and a `justification` ("This fits Level 3 because…") — the exact diagnostic fields a student/teacher needs.

## Features

- Rubric-based grading with AO1–AO4 breakdown + commentary
- 5 strengths / 5 weaknesses / 5 improvements, each linked to a verbatim quote from the essay
- **Annotated essay view** — click any feedback item to scroll to and highlight the relevant passage
- **PDF / .docx / .txt upload** — drag-and-drop or picker (uses `unpdf` + `mammoth`)
- **Deep Analysis mode** — second independent read with agreement classification (strong / moderate / weak)
- **Level 4 exemplar generation** — on-demand, tailored to this specific question and this student's gaps
- **Shareable URL** (`/g/[payload]`) — self-contained base64url-encoded result, no database
- **Bring-your-own API key** — students can use their own Anthropic key (your cost = $0 for those sessions)
- **Confidence score** on every grade

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- `@anthropic-ai/sdk` (Sonnet 4.5 for grading, Haiku 4.5 for exemplar)
- `unpdf` + `mammoth` for file extraction
- Zod for LLM response validation
- Deploys to **Vercel** with zero config (serverless functions for every `/api/*`)

## Cost per grade (ballpark)

| Mode                     | Claude cost   |
|--------------------------|---------------|
| Standard grade           | ~$0.03        |
| + Deep Analysis          | ~$0.06        |
| + Exemplar (Haiku)       | +$0.005       |
| Student uses their own key | $0          |

The in-memory cache makes re-submissions free during calibration testing.

## Project structure

```
.
├── app/
│   ├── api/
│   │   ├── grade/route.ts        POST /api/grade
│   │   ├── extract/route.ts      POST /api/extract  (multipart file upload)
│   │   └── exemplar/route.ts     POST /api/exemplar (Level 4 outline)
│   ├── g/[token]/page.tsx        Shared result page
│   ├── layout.tsx
│   ├── page.tsx                  Main UI
│   └── globals.css
├── components/
│   ├── EssayForm.tsx             Form + drag-drop + deep-analysis toggle
│   ├── ResultView.tsx            Composes the full report
│   ├── ScoreHeader.tsx           Score, level, confidence, tiebreaker, share
│   ├── AOBreakdown.tsx
│   ├── FeedbackLists.tsx         Clickable items
│   ├── AnnotatedEssay.tsx        Essay with highlighted quotes
│   ├── DiagnosticsCards.tsx      Justification / Missing Elements / Errors
│   └── ExemplarCard.tsx          On-demand Level 4 outline
├── lib/
│   ├── ai/claude.ts              Anthropic wrapper, retry, key injection
│   ├── grading/
│   │   ├── rubric.ts             IB markbands (single source of truth)
│   │   ├── preChecks.ts          Deterministic zero-API signals
│   │   ├── prompt.ts             Examiner system + user prompts
│   │   ├── validator.ts          Zod schema + JSON extraction
│   │   ├── grader.ts             Orchestrator (pre-checks → Claude → validate → cache)
│   │   └── cache.ts              In-memory LRU
│   ├── exemplar/generator.ts     Level 4 outline generator (Haiku)
│   ├── extract/parseFile.ts      PDF / docx / txt → plain text
│   ├── share/encode.ts           base64url share payload
│   └── types.ts
└── tests/
    ├── sample-essays.ts          Low / mid / high quality fixtures
    └── run-samples.ts            E2E harness against a running server
```

## Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Open http://localhost:3000.

## API

### `POST /api/grade`

```json
{
  "question": "Discuss the view that ... [10]",
  "essay": "...",
  "questionType": "10-mark",
  "apiKey": "sk-ant-... (optional)",
  "deepAnalysis": false
}
```

Response is a `GradeResult` (see `lib/types.ts`). Highlights:

```json
{
  "score": 7,
  "level": 3,
  "confidence": 0.82,
  "justification": "This response fits Level 3 because ...",
  "missing_elements": ["evaluation"],
  "errors": [],
  "ao_scores":  { "AO1": 2, "AO2": 1, "AO3": 2, "AO4": 2 },
  "ao_max":     { "AO1": 2, "AO2": 2, "AO3": 3, "AO4": 3 },
  "strengths": [
    { "text": "...", "quote": "verbatim passage" }, ...
  ],
  "tiebreaker": {
    "second_score": 7, "second_level": 3,
    "score_delta": 0, "agreement": "strong"
  }
}
```

### `POST /api/extract`

`multipart/form-data` with a `file` field (PDF / .docx / .txt, 5 MB cap). Returns `{ text, wordCount, kind, filename }`.

### `POST /api/exemplar`

```json
{
  "question": "...",
  "apiKey": "sk-ant-... (optional)",
  "grade": {
    "score": 6,
    "level": 2,
    "missing_elements": ["evaluation","real_world_example"],
    "errors": [],
    "weaknesses": [{ "text": "..." }]
  }
}
```

Returns an `ExemplarResponse` with a structured Level 4 outline and a "what you missed" list.

## Testing with the sample essays

Start the dev server, then in another terminal:

```bash
npx tsx tests/run-samples.ts
```

Prints expected-vs-predicted. Use it as a calibration harness when you compare against real student grades.

## Deploying to Vercel

1. Push this repo to GitHub.
2. `vercel` or import the repo at vercel.com/new.
3. In **Project → Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` (required server default)
   - `ANTHROPIC_MODEL` = `claude-sonnet-4-5` (optional)
   - `ANTHROPIC_EXEMPLAR_MODEL` = `claude-haiku-4-5` (optional)
   - `MAX_ESSAY_CHARS` = `12000` (optional)
4. Deploy. The grading endpoint runs as a serverless function with `maxDuration = 60s` (configured in `app/api/grade/route.ts`). On the Hobby plan, drop it to `30s`.

## Extending

- **15-mark essays** — `lib/grading/rubric.ts` already has a placeholder. Fill in markbands + a select in `EssayForm.tsx`; the prompt, validator, and API all key off `questionType`.
- **Calibration mode** — once you have ≥ 50 real graded essays, you can fit a simple bias correction on AO deltas and apply it after `gradeEssay`. Hooks in `lib/grading/grader.ts` make this easy to drop in.
- **Persistent share links** — swap `/g/[token]` for a Vercel KV store and issue short IDs.

## Design constraints honoured

- ✅ Rubric-driven, not similarity-based
- ✅ Deterministic (temperature 0, strict JSON, Zod)
- ✅ Strict caps (definitions / application / reasoning / errors)
- ✅ Internal examiner checklist + band justification
- ✅ Missing elements / errors / confidence explicit in output
- ✅ Exactly 5 strengths / weaknesses / improvements with verbatim quotes
- ✅ Annotated essay view with scroll-to-highlight
- ✅ PDF / docx upload
- ✅ Tiebreaker deep analysis
- ✅ Level 4 exemplar on demand
- ✅ Shareable URLs with no DB
- ✅ Bring-your-own API key
- ✅ Serverless-friendly, no database required
