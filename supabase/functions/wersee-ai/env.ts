export class EnvError extends Error {
  code = "AI_SERVER_MISCONFIGURED";
}

export const requireEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new EnvError(`Required server environment variable ${name} is not configured.`);
  return value;
};

export const getSupabaseEnv = () => ({
  url: requireEnv("SUPABASE_URL"),
  publishableKey:
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim() ||
    Deno.env.get("SUPABASE_ANON_KEY")?.trim() ||
    (() => {
      throw new EnvError("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is required.");
    })(),
  serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
});

export const getAiEnv = () => ({
  provider: (Deno.env.get("WERSEE_AI_PROVIDER") || "groq").trim().toLowerCase(),
  model: Deno.env.get("WERSEE_AI_MODEL")?.trim(),
  groqKey: Deno.env.get("GROQ_API_KEY")?.trim(),
  geminiKey: Deno.env.get("GEMINI_API_KEY")?.trim(),
  openAiKey: Deno.env.get("OPENAI_API_KEY")?.trim(),
  perMinuteLimit: Math.max(1, Number(Deno.env.get("WERSEE_AI_RATE_LIMIT_PER_MINUTE") || 20)),
  dailyRunLimit: Math.max(1, Number(Deno.env.get("WERSEE_AI_DAILY_RUN_LIMIT") || 200)),
});
