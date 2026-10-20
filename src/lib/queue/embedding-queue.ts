import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const embeddingQueue = new Queue("repository-embedding", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
