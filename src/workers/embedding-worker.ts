import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue/redis";
import {
  findRepositoryChunksWithoutEmbeddings,
  storeRepositoryChunkEmbeddings,
} from "@/features/repositories/repository.repository";
import { EMBEDDING_BATCH_SIZE } from "@/features/embedding/embedding.config";
import { generateDocumentEmbeddings } from "@/features/embedding/embedding.service";

const worker = new Worker(
  "repository-embedding",
  async (job) => {
    console.log(`Embedding job ${job.id} started`);
    console.log("Repository ID:", job.data.repositoryId);

    // Embedding generation and persistence will be added here.
    while (true) {
      const chunks = await findRepositoryChunksWithoutEmbeddings(
        job.data.repositoryId,
        EMBEDDING_BATCH_SIZE,
      );

      if (chunks.length === 0) {
        break;
      }

      const embeddings = await generateDocumentEmbeddings(chunks);

      await storeRepositoryChunkEmbeddings(chunks, embeddings);

      await new Promise((resolve) => setTimeout(resolve, 60_000));
    }

    return {
      message: "Embedding test completed",
      repositoryId: job.data.repositoryId,
    };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

worker.on("completed", (job, result) => {
  console.log(`Embedding job ${job.id} completed:`, result);
});

worker.on("failed", (job, error) => {
  console.error(`Embedding job ${job?.id} failed:`, error.message);
});

worker.on("error", (error) => {
  console.error("Embedding worker error:", error.message);
});

console.log("Embedding worker is waiting for jobs...");

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing embedding worker...`);

  await worker.close();
  await redisConnection.quit();

  console.log("Embedding worker shut down cleanly.");
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
