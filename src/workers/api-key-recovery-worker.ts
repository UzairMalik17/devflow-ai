import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue/redis";
import { embeddingApiKeyManager } from "@/lib/gemini/embedding-key-manager";
import { generateQueryEmbedding } from "@/features/embedding/embedding.service";

export const apiKeyRecoveryWorker = new Worker(
  "gemini-api-key-recovery",
  async (job) => {
    console.log(`API key recovery job ${job.id} started`);

    const apiKeyStatuses = embeddingApiKeyManager.getApiKeyStatus();

    const unavailableKeys = apiKeyStatuses.filter(
      (key) => key.status === "unavailable",
    );

    if (unavailableKeys.length === 0) {
      console.log("No unavailable API keys found.");

      return {
        checked: 0,
        message: "No unavailable API keys found.",
      };
    }

    console.log(`Found ${unavailableKeys.length} unavailable API keys.`);

    let checked = 0;

    for (let i = 0; i < unavailableKeys.length; i++) {
      const key = embeddingApiKeyManager.getNextUnavailableApiKey();

      if (!key) {
        break;
      }
      try {
        await generateQueryEmbedding("API key health check", key.apiKey);

        embeddingApiKeyManager.markApiKeyAvailable(key.id);

        console.log(`API key ${key.id} recovered successfully.`);
      } catch (error) {
        console.error(`API key ${key.id} recovery failed:`, error);
      }

      checked++;
    }

    return {
      checked,
      message: "API key recovery checks completed.",
    };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

apiKeyRecoveryWorker.on("completed", (job, result) => {
  console.log(`Recovery job ${job.id} completed:`, result);
});

apiKeyRecoveryWorker.on("failed", (job, error) => {
  console.error(`Recovery job ${job?.id} failed:`, error.message);
});

apiKeyRecoveryWorker.on("error", (error) => {
  console.error("Recovery worker error:", error.message);
});
