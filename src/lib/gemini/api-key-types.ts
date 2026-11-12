export type ApiKeyStatus = "available" | "unavailable";

export interface ApiKeyError {
  message: string;
  code?: number;
  occurredAt: Date;
}

export type GeminiApiKey =
  | {
      id: string;
      apiKey: string;
      status: "available";
    }
  | {
      id: string;
      apiKey: string;
      status: "unavailable";
      error: ApiKeyError;
    };

export interface SelectedApiKey {
  id: string;
  apiKey: string;
}
