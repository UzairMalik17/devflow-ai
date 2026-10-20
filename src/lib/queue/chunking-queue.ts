import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const chunkingQueue = new Queue("repository-chunking", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
