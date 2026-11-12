import { createGeminiApiKeyManager } from "./api-key-manager";
import type { GeminiApiKey } from "./api-key-types";

const initialKeys: GeminiApiKey[] = [];

const embeddingApiKeys = [
  process.env.GEMINI_EMBEDDING_API_KEY_1,
  process.env.GEMINI_EMBEDDING_API_KEY_2,
  process.env.GEMINI_EMBEDDING_API_KEY_3,
  process.env.GEMINI_EMBEDDING_API_KEY_4,
  process.env.GEMINI_EMBEDDING_API_KEY_5,
];

embeddingApiKeys.forEach((apiKey, index) => {
  if (apiKey) {
    initialKeys.push({
      id: `embedding-key-${index + 1}`,
      apiKey,
      status: "available",
    });
  }
});

if (initialKeys.length === 0) {
  throw new Error("No Gemini embedding API keys configured.");
}

export const embeddingApiKeyManager = createGeminiApiKeyManager(initialKeys);
