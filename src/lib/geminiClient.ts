import { GoogleGenAI } from '@google/genai';

const getGeminiApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  return key.trim();
};

export const isGeminiConfigured = () => Boolean(getGeminiApiKey());

let aiClient: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI | null => {
  if (aiClient) return aiClient;

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

export const requireGeminiClient = (): GoogleGenAI => {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      'Gemini API key is missing. Set VITE_GEMINI_API_KEY for frontend development or GEMINI_API_KEY for backend processes.'
    );
  }
  return ai;
};
