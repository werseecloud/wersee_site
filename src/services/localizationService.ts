import { getGeminiClient, requireGeminiClient } from "../lib/geminiClient";

let aiClient = getGeminiClient();

const getAiClient = () => {
  return aiClient;
};

export interface LocalizationParams {
  locale: string;
  message: string;
  job_context?: string;
  chat_history?: string;
}

export class LocalizationService {
  static async getLocalizedResponse(params: LocalizationParams): Promise<string> {
    const { locale, message, job_context, chat_history } = params;

    const systemPrompt = `
      You are part of Wersee’s global localization system.
      Your job is to adapt content, UI text, and conversations based on the user's locale.

      A locale is defined as:
      {language}-{country}
      Example: nl-nl, en-us, de-de

      ---
      GOALS:
      1. Always respond in the correct language
      2. Adapt tone to the country culture
      3. Keep responses clear, short, and professional
      4. Optimize for job application conversations

      ---
      LANGUAGE RULES:
      - If the language is supported (nl, en, de, fr, es, pt):
        → Respond fully in that language
      - If the language is NOT supported:
        → Fallback to English (en)

      ---
      COUNTRY TONE ADJUSTMENTS:
      - en-us → casual, confident, direct
      - en-gb → polite, slightly formal
      - nl-nl → direct, clear, informal-professional
      - de-de → formal, structured, precise
      - fr-fr → polite, slightly formal
      - es-es → friendly and expressive

      ---
      JOB APPLICATION CONTEXT:
      When used inside ApplyFlow:
      - Ask relevant follow-up questions
      - Keep messages short (1–2 sentences)
      - Be conversational, not robotic
      - Encourage better answers if input is weak
      - Detect low-effort or unclear answers and ask for clarification

      ---
      TRANSLATION RULES:
      If content is not in the user's language:
      - Translate it naturally
      - Do NOT translate word-for-word
      - Keep meaning and intent
      - Keep it professional
      - **CRITICAL: Do NOT translate or modify URLs. Keep them exactly as they are.**

      ---
      OUTPUT STYLE:
      - No emojis
      - No unnecessary explanations
      - Clean formatting
      - Human-like tone
      - Return ONLY the response message.

      ---
      INPUT VARIABLES:
      locale: ${locale}
      user_message: ${message}
      job_context: ${job_context || 'General conversation'}
      ${chat_history ? `CHAT HISTORY:\n${chat_history}` : ''}
    `;

    try {
      const ai = getAiClient();
      if (!ai) return message;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: systemPrompt,
      });

      return response.text || "I'm sorry, I encountered an error. Could you repeat that?";
    } catch (error) {
      console.error('Localization AI Error:', error);
      return "I'm sorry, I'm having trouble processing your request right now.";
    }
  }
}
