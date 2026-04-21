export type ProviderId = "anthropic" | "openai" | "gemini";

export interface LLMCallOptions {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  /** Clamped by each provider to a safe low range for deterministic grading. */
  temperature?: number;
  maxTokens?: number;
  maxAttempts?: number;
  /** Ask the provider to return JSON (JSON mode / responseMimeType). */
  forceJson?: boolean;
}

export interface LLMProvider {
  id: ProviderId;
  label: string;
  /** Fallback when caller didn't specify a model and no env override set. */
  defaultModel: string;
  /** Env var name that can override the default model. */
  modelEnvVar: string;
  call(opts: LLMCallOptions): Promise<string>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderId,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LLMError";
  }
}
