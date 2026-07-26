import { werseeAi } from '../ai/client';

type GenerateRequest = {
  model?: string;
  contents: unknown;
  config?: Record<string, unknown>;
};

type SecureGenerationResponse = { text: string };

class SecureWerseeAiModels {
  async generateContent(request: GenerateRequest): Promise<SecureGenerationResponse> {
    return werseeAi.generateText({ contents: request.contents, config: request.config });
  }

  async generateContentStream(request: GenerateRequest): Promise<AsyncGenerator<SecureGenerationResponse>> {
    const response = await this.generateContent(request);
    return (async function* () {
      const chunkSize = 120;
      for (let index = 0; index < response.text.length; index += chunkSize) {
        yield { text: response.text.slice(index, index + chunkSize) };
      }
    })();
  }
}

export class SecureWerseeAiClient {
  readonly models = new SecureWerseeAiModels();
}

// Compatibility constants for the two legacy JSON-schema call sites. They are
// data only; no provider SDK or credential is included in the browser bundle.
export const Type = {
  ARRAY: 'ARRAY',
  STRING: 'STRING',
  OBJECT: 'OBJECT',
  INTEGER: 'INTEGER',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
} as const;

const secureClient = new SecureWerseeAiClient();

export const isGeminiConfigured = () => true;
export const getGeminiClient = (): SecureWerseeAiClient => secureClient;
export const requireGeminiClient = (): SecureWerseeAiClient => secureClient;
