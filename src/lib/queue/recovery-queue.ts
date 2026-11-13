import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const recoveryQueue = new Queue("gemini-api-key-recovery", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
