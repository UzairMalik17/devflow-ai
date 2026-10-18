import { testQueue } from "./test-queue";

async function main() {
  const job = await testQueue.add("hello", {
    message: "Hello from DevFlow AI!",
  });

  console.log(`Added job ${job.id}`);

  await testQueue.close();
}

main().catch((error) => {
  console.error("Failed to add test job:", error);
  process.exitCode = 1;
});
