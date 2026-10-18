import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue/redis";

const worker = new Worker(
  "devflow-test",
  async (job) => {
    console.log(`Processing job ${job.id}`);
    console.log("Job data:", job.data);

    return {
      message: `Successfully processed: ${job.data.message}`,
    };
  },
  {
    connection: redisConnection,
  },
);

worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("DevFlow test worker is waiting for jobs...");
