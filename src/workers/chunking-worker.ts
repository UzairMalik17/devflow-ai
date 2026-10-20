import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue/redis";
import { storeRepositoryChunks } from "@/features/repositories/repository.repository";
import { downloadGitHubRepositoryArchive } from "@/features/repositories/github.repository";
import { readRepositoryArchive } from "@/features/repositories/repository.archive";
import { chunkRepositoryFile } from "@/features/repositories/repository.service";
import { embeddingQueue } from "@/lib/queue/embedding-queue";

const worker = new Worker(
  "repository-chunking",
  async (job) => {
    console.log(`Chunking job ${job.id} started`);

    const archive = await downloadGitHubRepositoryArchive(
      job.data.owner,
      job.data.name,
      job.data.defaultBranch,
    );

    const files = await readRepositoryArchive(archive);

    const chunks = files.flatMap((file) => chunkRepositoryFile(file));

    await storeRepositoryChunks(job.data.id, chunks);

    await embeddingQueue.add("embed-repository", {
      repositoryId: job.data.id,
    });

    return {
      message: "Chunking test completed",
      repositoryId: job.data.id,
    };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

worker.on("completed", (job, result) => {
  console.log(`Chunking job ${job.id} completed:`, result);
});

worker.on("failed", (job, error) => {
  console.error(`Chunking job ${job?.id} failed:`, error.message);
});

worker.on("error", (error) => {
  console.error("Chunking worker error:", error.message);
});

console.log("Chunking worker is waiting for jobs...");

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing Chunking worker...`);

  await worker.close();
  await redisConnection.quit();

  console.log("Chunking worker shut down cleanly.");
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
