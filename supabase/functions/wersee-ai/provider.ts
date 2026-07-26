import { z } from "zod";
import { getAiEnv } from "./env.ts";
import { promptInjectionNotice } from "./contextBuilder.ts";
import type { AiCompletionInput, AiProvider, AiToolPlan, AiToolPlanningInput } from "./types.ts";

const toolPlanSchema = z.object({
  summary: z.string().trim().min(1).max(1000),
  toolCalls: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    input: z.record(z.string(), z.unknown()),
  }).strict()).max(12).default([]),
  assistantMessage: z.string().trim().max(6000).optional(),
}).strict();

class ProviderError extends Error {
  constructor(public code: string, message: string, public retryable = true) {
    super(message);
  }
}

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 45000) => {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  const response = await fetch(url, { ...init, signal });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    const code = response.status === 429 ? "AI_PROVIDER_RATE_LIMITED" : "AI_PROVIDER_ERROR";
    throw new ProviderError(code, `AI provider request failed with status ${response.status}.`, response.status >= 500 || response.status === 429);
  }
  return response;
};

const parseSse = async function* (response: Response): AsyncGenerator<unknown> {
  if (!response.body) throw new ProviderError("AI_PROVIDER_EMPTY_STREAM", "AI provider returned no stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";
      for (const event of events) {
        const data = event.split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("");
        if (!data || data === "[DONE]") continue;
        try { yield JSON.parse(data); } catch { /* Ignore provider keep-alive frames. */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

const buildPlanningPrompt = (input: AiToolPlanningInput) => {
  const toolCatalog = input.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    riskLevel: tool.riskLevel,
    requiredScopes: tool.requiredScopes,
    input: tool.inputHint,
  }));
  return `${promptInjectionNotice}

Return one JSON object with exactly these keys:
{"summary":"short plan summary","toolCalls":[{"name":"registered.tool","input":{}}],"assistantMessage":"optional text when no tool is needed"}

Rules:
- Use only tools in REGISTERED_TOOLS.
- Never invent identifiers, metrics, URLs, or completed actions.
- Prefer read tools before mutation tools when an identifier is missing.
- A draft is not published content.
- Do not include chain-of-thought or hidden reasoning.
- Tool input must match the described input exactly.

MODE: ${input.mode}
TRUSTED_CONTEXT: ${JSON.stringify(input.trustedContext)}
REGISTERED_TOOLS: ${JSON.stringify(toolCatalog)}
UNTRUSTED_DATA: ${JSON.stringify(input.untrustedContext)}
USER_REQUEST: ${input.request}`;
};

abstract class OpenAiCompatibleProvider implements AiProvider {
  abstract readonly name: string;
  constructor(
    public readonly model: string,
    private readonly apiKey: string,
    private readonly endpoint: string,
  ) {}

  private async completeJson(prompt: string, signal?: AbortSignal): Promise<AiToolPlan> {
    const response = await fetchWithTimeout(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: "You are Wersee's server-side planning engine. Return validated JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1800,
      }),
      signal,
    });
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new ProviderError("AI_PROVIDER_INVALID_RESPONSE", "AI provider returned an invalid planning response.", false);
    let value: unknown;
    try { value = JSON.parse(content); } catch { throw new ProviderError("AI_PROVIDER_INVALID_JSON", "AI provider did not return valid structured output.", true); }
    return toolPlanSchema.parse(value);
  }

  createToolPlan(input: AiToolPlanningInput) {
    return this.completeJson(buildPlanningPrompt(input), input.signal);
  }

  async *streamCompletion(input: AiCompletionInput) {
    const response = await fetchWithTimeout(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: input.system }, ...input.messages],
        stream: true,
        temperature: input.temperature ?? 0.35,
        max_tokens: input.maxTokens ?? 1800,
      }),
      signal: input.signal,
    });

    for await (const event of parseSse(response)) {
      const text = (event as any)?.choices?.[0]?.delta?.content;
      if (typeof text === "string" && text) yield { type: "delta" as const, text };
    }
  }
}

class GroqProvider extends OpenAiCompatibleProvider {
  readonly name = "groq";
}

class OpenAiProvider extends OpenAiCompatibleProvider {
  readonly name = "openai";
}

class GeminiProvider implements AiProvider {
  readonly name = "gemini";
  constructor(public readonly model: string, private readonly apiKey: string) {}

  private endpoint(stream = false) {
    const method = stream ? "streamGenerateContent?alt=sse" : "generateContent";
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:${method}`;
  }

  async createToolPlan(input: AiToolPlanningInput): Promise<AiToolPlan> {
    const response = await fetchWithTimeout(this.endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPlanningPrompt(input) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 1800 },
      }),
      signal: input.signal,
    });
    const payload = await response.json();
    const content = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("");
    if (typeof content !== "string") throw new ProviderError("AI_PROVIDER_INVALID_RESPONSE", "AI provider returned an invalid planning response.", false);
    let value: unknown;
    try { value = JSON.parse(content); } catch { throw new ProviderError("AI_PROVIDER_INVALID_JSON", "AI provider did not return valid structured output.", true); }
    return toolPlanSchema.parse(value);
  }

  async *streamCompletion(input: AiCompletionInput) {
    const prompt = `${input.system}\n\n${input.messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n")}`;
    const response = await fetchWithTimeout(this.endpoint(true), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: input.temperature ?? 0.35, maxOutputTokens: input.maxTokens ?? 1800 },
      }),
      signal: input.signal,
    });
    for await (const event of parseSse(response)) {
      const text = (event as any)?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("");
      if (typeof text === "string" && text) yield { type: "delta" as const, text };
    }
  }
}

export const createAiProvider = (): AiProvider => {
  const env = getAiEnv();
  const preferred = env.provider;
  const order = [preferred, "groq", "gemini", "openai"];
  const providers: AiProvider[] = [];
  for (const candidate of [...new Set(order)]) {
    if (candidate === "groq" && env.groqKey) {
      providers.push(new GroqProvider(candidate === preferred ? env.model || "openai/gpt-oss-20b" : "openai/gpt-oss-20b", env.groqKey, "https://api.groq.com/openai/v1/chat/completions"));
    }
    if (candidate === "gemini" && env.geminiKey) {
      providers.push(new GeminiProvider(candidate === preferred ? env.model || "gemini-2.5-flash" : "gemini-2.5-flash", env.geminiKey));
    }
    if (candidate === "openai" && env.openAiKey) {
      providers.push(new OpenAiProvider(candidate === preferred ? env.model || "gpt-4.1-mini" : "gpt-4.1-mini", env.openAiKey, "https://api.openai.com/v1/chat/completions"));
    }
  }
  if (!providers.length) throw new ProviderError("AI_PROVIDER_NOT_CONFIGURED", "No server-side Wersee AI provider is configured.", false);
  if (providers.length === 1) return providers[0];

  const primary = providers[0];
  let active = primary;
  return {
    get name() { return active.name; },
    get model() { return active.model; },
    async createToolPlan(input) {
      let lastError: unknown;
      for (const provider of providers) {
        try {
          const plan = await provider.createToolPlan(input);
          active = provider;
          return plan;
        } catch (error) { lastError = error; }
      }
      throw lastError || new ProviderError("AI_PROVIDER_FAILED", "All configured providers failed.");
    },
    async *streamCompletion(input) {
      let lastError: unknown;
      for (const provider of providers) {
        let yielded = false;
        try {
          for await (const event of provider.streamCompletion(input)) {
            yielded = true;
            active = provider;
            yield event;
          }
          active = provider;
          return;
        } catch (error) {
          lastError = error;
          if (yielded) throw error;
        }
      }
      throw lastError || new ProviderError("AI_PROVIDER_FAILED", "All configured providers failed.");
    },
  };
};

export const toPublicProviderError = (error: unknown) => {
  const providerError = error instanceof ProviderError ? error : null;
  const messages: Record<string, string> = {
    AI_PROVIDER_NOT_CONFIGURED: "Wersee AI has not been configured by the workspace administrator.",
    AI_PROVIDER_RATE_LIMITED: "The AI provider is busy. Try again shortly.",
    AI_PROVIDER_INVALID_RESPONSE: "The AI provider returned an invalid response. Try again.",
    AI_PROVIDER_INVALID_JSON: "The AI provider could not produce a valid action plan. Try rephrasing the request.",
  };
  return {
    code: providerError?.code || "AI_PROVIDER_FAILED",
    message: providerError ? messages[providerError.code] || "Wersee AI is temporarily unavailable." : "Wersee AI is temporarily unavailable.",
    retryable: providerError?.retryable ?? true,
  };
};
