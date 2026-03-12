import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL || "";
const conn = { url: redisUrl };

async function main() {
  const fetchQueue = new Queue("ingestion-fetch", { connection: conn });
  const parseQueue = new Queue("ingestion-parse", { connection: conn });
  const normQueue = new Queue("ingestion-normalize", { connection: conn });
  const embedQueue = new Queue("ingestion-embed", { connection: conn });

  // Drain all queues (remove completed/failed/waiting/delayed)
  console.log("Draining all queues...");

  for (const [name, q] of [["fetch", fetchQueue], ["parse", parseQueue], ["normalize", normQueue], ["embed", embedQueue]] as const) {
    const counts = await (q as Queue).getJobCounts();
    console.log(`  ${name}: ${JSON.stringify(counts)}`);
    await (q as Queue).drain();
    // Also obliterate completed/failed
    await (q as Queue).clean(0, 1000, "completed");
    await (q as Queue).clean(0, 1000, "failed");
  }

  console.log("All queues drained.\n");

  // Now manually add a fresh parse job to test the pipeline
  // We'll trigger via the scheduler instead — just verify queues are clean
  const postCounts = await parseQueue.getJobCounts();
  console.log("Parse queue after drain:", JSON.stringify(postCounts));

  await fetchQueue.close();
  await parseQueue.close();
  await normQueue.close();
  await embedQueue.close();

  console.log("\nDone. Now start fresh worker: npx tsx src/services/ingestion/start.ts");
}

main().catch(console.error);
