import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const testQueue = new Queue("devflow-test", {
  connection: redisConnection,
});
