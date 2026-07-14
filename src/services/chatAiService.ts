import { getGeminiClient, requireGeminiClient } from "../lib/geminiClient";

// Fully lazy: only calls getGeminiClient() when an AI function is actually invoked.
const getAI = (): ReturnType<typeof getGeminiClient> => {
  return getGeminiClient();
};

export const checkMessageForForbiddenLinks = async (content: string): Promise<{ safe: boolean; cleanedContent: string; reason?: string }> => {
  // Fast check: if no links, skip AI
  const linkRegex = /https?:\/\/[^\s]+/g;
  const links = content.match(linkRegex);

  if (!links || links.length === 0) {
    return { safe: true, cleanedContent: content };
  }

  const ai = getAI();

  // AI Check for payment links
  try {
    if (!ai) throw new Error('GEMINI_API_KEY not configured');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the following message for forbidden payment links.
        Forbidden: Any payment links (Stripe, PayPal, Buy Me a Coffee, etc.) that are NOT from Wersee (wersee.com).
        Allowed: Any other links (Google, YouTube, etc.) and Wersee links (wersee.com).
        
        If a forbidden link is found, return a JSON object with:
        - "safe": false
        - "cleanedContent": The message with forbidden links replaced by "[FORBIDDEN LINK REMOVED]"
        - "reason": A short explanation
        
        If no forbidden links are found, return:
        - "safe": true
        - "cleanedContent": The original message
        
        Message: "${content}"
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{"safe": true}');
    return {
      safe: result.safe ?? true,
      cleanedContent: result.cleanedContent ?? content,
      reason: result.reason
    };
  } catch (error) {
    console.error('AI Link Detection Error:', error);
    // Fallback to basic regex if AI fails
    const forbiddenPatterns = [/stripe\.com/, /paypal\.me/, /paypal\.com/, /buymeacoffee\.com/];
    let cleaned = content;
    let found = false;
    
    for (const link of links) {
      const isWersee = link.includes('wersee.com');
      if (!isWersee && forbiddenPatterns.some(pattern => pattern.test(link))) {
        cleaned = cleaned.replace(link, '[FORBIDDEN LINK REMOVED]');
        found = true;
      }
    }
    
    return { safe: !found, cleanedContent: cleaned };
  }
};
