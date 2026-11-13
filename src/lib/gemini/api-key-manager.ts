import type {
  ApiKeyError,
  GeminiApiKey,
  SelectedApiKey,
} from "./api-key-types";

export function createGeminiApiKeyManager(initialKeys: GeminiApiKey[]) {
  const apiKeys = [...initialKeys];
  let currentIndex = 0;

  function getNextAvailableApiKey(): SelectedApiKey | null {
    if (apiKeys.length === 0) {
      return null;
    }

    for (let i = 0; i < apiKeys.length; i++) {
      const index = (currentIndex + i) % apiKeys.length;
      const key = apiKeys[index];

      if (key.status === "available") {
        currentIndex = (index + 1) % apiKeys.length;

        return {
          id: key.id,
          apiKey: key.apiKey,
        };
      }
    }

    return null;
  }

  function markApiKeyUnavailable(apiKeyId: string, error: ApiKeyError): void {
    const keyIndex = apiKeys.findIndex((key) => key.id === apiKeyId);

    if (keyIndex === -1) {
      throw new Error(`API key not found: ${apiKeyId}`);
    }

    const key = apiKeys[keyIndex];

    apiKeys[keyIndex] = {
      ...key,
      status: "unavailable",
      error,
    };
  }

  function markApiKeyAvailable(apiKeyId: string): void {
    const keyIndex = apiKeys.findIndex((key) => key.id === apiKeyId);

    if (keyIndex === -1) {
      throw new Error(`API key not found: ${apiKeyId}`);
    }

    const key = apiKeys[keyIndex];

    apiKeys[keyIndex] = {
      id: key.id,
      apiKey: key.apiKey,
      status: "available",
    };
  }

  function getApiKeyStatus() {
    return apiKeys.map((key) => {
      if (key.status === "unavailable") {
        return {
          id: key.id,
          status: key.status,
          error: key.error,
        };
      }

      return {
        id: key.id,
        status: key.status,
      };
    });
  }

  function getNextUnavailableApiKey(): SelectedApiKey | null {
    if (apiKeys.length === 0) {
      return null;
    }

    for (let i = 0; i < apiKeys.length; i++) {
      const index = (currentIndex + i) % apiKeys.length;
      const key = apiKeys[index];

      if (key.status === "unavailable") {
        currentIndex = (index + 1) % apiKeys.length;

        return {
          id: key.id,
          apiKey: key.apiKey,
        };
      }
    }

    return null;
  }

  return {
    getNextAvailableApiKey,
    markApiKeyUnavailable,
    markApiKeyAvailable,
    getApiKeyStatus,
    getNextUnavailableApiKey,
  };
}
