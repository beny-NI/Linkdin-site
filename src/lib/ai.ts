/**
 * Provider-agnostic AI helper: works with ANY OpenAI-compatible "chat/completions" API
 * (OpenAI, OpenRouter, Groq, Together, DeepSeek, Mistral, Ollama, Gemini's OpenAI endpoint, ...).
 *
 * .env:
 *   AI_API_KEY="..."
 *   AI_BASE_URL="https://api.openai.com/v1"      (the provider's OpenAI-compatible base URL)
 *   AI_MODEL="gpt-4o-mini"                        (any model name the provider offers)
 */
export function aiConfigured(): boolean {
  return !!(process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL);
}

export function aiMissingSettings(): string[] {
  return ["AI_API_KEY", "AI_BASE_URL", "AI_MODEL"].filter((k) => !process.env[k]);
}

function endpoint(): string {
  const base = (process.env.AI_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** Sends one system + user message and returns the assistant text. */
export async function aiComplete(system: string, user: string, maxTokens = 4000): Promise<string> {
  if (!aiConfigured()) throw new AiError(`AI is not configured (missing ${aiMissingSettings().join(", ")} in .env)`, 503);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      console.error("[ai] provider answered", res.status, detail);
      throw new AiError(`The AI provider answered with an error (${res.status}). Check AI_API_KEY, AI_BASE_URL and AI_MODEL.`);
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content;
    if (!text) throw new AiError("The AI provider returned an empty answer");
    return text;
  } catch (err) {
    if (err instanceof AiError) throw err;
    console.error("[ai]", err);
    throw new AiError("Could not reach the AI provider (check AI_BASE_URL)");
  } finally {
    clearTimeout(timer);
  }
}

/** Extracts the first JSON object from a model answer (handles ```json fences and chatter). */
export function extractJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new AiError("The AI answer did not contain structured data");
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new AiError("The AI answer could not be read — try again or paste more text");
  }
}
