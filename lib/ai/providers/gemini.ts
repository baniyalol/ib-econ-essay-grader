import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMError, type LLMCallOptions, type LLMProvider } from "../types";

export const geminiProvider: LLMProvider = {
  id: "gemini",
  label: "Google Gemini",
  defaultModel: "gemini-2.0-flash",
  modelEnvVar: "GEMINI_MODEL",
  call: callGemini,
};

async function callGemini(opts: LLMCallOptions): Promise<string> {
  const {
    apiKey,
    model = process.env.GEMINI_MODEL || geminiProvider.defaultModel,
    systemPrompt,
    userPrompt,
    temperature = 0,
    maxTokens = 1800,
    maxAttempts = 3,
    forceJson = true,
  } = opts;

  if (!apiKey) {
    throw new LLMError("Missing Google API key.", "gemini");
  }

  const clampedTemp = Math.max(0, Math.min(0.3, temperature));
  const client = new GoogleGenerativeAI(apiKey);
  const generativeModel = client.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: clampedTemp,
      maxOutputTokens: maxTokens,
      responseMimeType: forceJson ? "application/json" : "text/plain",
    },
  });

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generativeModel.generateContent(userPrompt);
      const text = result.response.text().trim();
      if (!text) throw new LLMError("Empty response from Gemini.", "gemini");
      return text;
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      const retriable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("500") ||
        msg.includes("unavailable") ||
        msg.includes("timeout");

      if (!retriable || attempt === maxAttempts) {
        if (msg.includes("api key") || msg.includes("401") || msg.includes("permission")) {
          throw new LLMError("Invalid Google API key.", "gemini", err);
        }
        if (msg.includes("404") || msg.includes("not found")) {
          throw new LLMError(
            `Gemini model '${model}' not found. Set GEMINI_MODEL to a model your key has access to (e.g. gemini-2.0-flash).`,
            "gemini",
            err,
          );
        }
        throw new LLMError(
          `Gemini request failed: ${err instanceof Error ? err.message : String(err)}`,
          "gemini",
          err,
        );
      }
      await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    }
  }
  throw new LLMError("Gemini retries exhausted.", "gemini", lastErr);
}
