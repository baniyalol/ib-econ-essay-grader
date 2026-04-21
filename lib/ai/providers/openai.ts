import OpenAI from "openai";
import { LLMError, type LLMCallOptions, type LLMProvider } from "../types";

export const openaiProvider: LLMProvider = {
  id: "openai",
  label: "OpenAI (GPT)",
  defaultModel: "gpt-4o",
  modelEnvVar: "OPENAI_MODEL",
  call: callOpenAI,
};

async function callOpenAI(opts: LLMCallOptions): Promise<string> {
  const {
    apiKey,
    model = process.env.OPENAI_MODEL || openaiProvider.defaultModel,
    systemPrompt,
    userPrompt,
    temperature = 0,
    maxTokens = 1800,
    maxAttempts = 3,
    forceJson = true,
  } = opts;

  if (!apiKey) {
    throw new LLMError("Missing OpenAI API key.", "openai");
  }

  const client = new OpenAI({ apiKey });
  const clampedTemp = Math.max(0, Math.min(0.3, temperature));

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await client.chat.completions.create({
        model,
        temperature: clampedTemp,
        max_tokens: maxTokens,
        response_format: forceJson ? { type: "json_object" } : undefined,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const text = resp.choices[0]?.message?.content?.trim() ?? "";
      if (!text) throw new LLMError("Empty response from OpenAI.", "openai");
      return text;
    } catch (err: unknown) {
      lastErr = err;
      const status = err instanceof OpenAI.APIError ? err.status : undefined;
      const retriable =
        status === 429 ||
        (typeof status === "number" && status >= 500 && status < 600) ||
        err instanceof OpenAI.APIConnectionError;

      if (!retriable || attempt === maxAttempts) {
        if (err instanceof OpenAI.AuthenticationError) {
          throw new LLMError(
            "Invalid OpenAI API key.",
            "openai",
            err,
            err.status,
          );
        }
        if (err instanceof OpenAI.NotFoundError) {
          throw new LLMError(
            `OpenAI model '${model}' not found. Set OPENAI_MODEL to a model your key has access to (e.g. gpt-4o).`,
            "openai",
            err,
            err.status,
          );
        }
        throw new LLMError(
          `OpenAI request failed${status ? ` (${status})` : ""}: ${
            err instanceof Error ? err.message : String(err)
          }`,
          "openai",
          err,
          status,
        );
      }
      await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    }
  }
  throw new LLMError("OpenAI retries exhausted.", "openai", lastErr);
}
