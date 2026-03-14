import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "";

async function main() {
  // Fetch the real WY HTML first
  console.log("Fetching WGFD page...");
  const res = await fetch("https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines");
  const html = await res.text();
  console.log(`Fetched ${html.length} bytes`);

  // Add a parse job directly to the parse queue
  const parseQueue = new Queue("ingestion-parse", { connection: { url: REDIS_URL } });

  const jobData = {
    sourceId: "test-pipeline-run",
    rawContent: html,
    docType: "season_summary",
    parser: "season_dates",
    metadata: {
      url: "https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines",
      fetchedAt: new Date().toISOString(),
      stateCode: "WY",
      year: 2026,
      columnMappings: {
        season_name: "license type",
        start_date: "open date",
        end_date: "close date",
      },
    },
  };

  const job = await parseQueue.add("test-parse-pipeline", jobData, { priority: 1 });
  console.log(`Added parse job: ${job.id} (name: ${job.name})`);

  // Wait and check results
  console.log("Waiting 10s for worker to process...");
  await new Promise((r) => setTimeout(r, 10000));

  // Check parse queue
  const parseCompleted = await parseQueue.getCompleted(0, 3);
  const parseFailed = await parseQueue.getFailed(0, 3);
  console.log(`\nParse queue: ${parseCompleted.length} completed, ${parseFailed.length} failed`);

  for (const j of parseCompleted) {
    console.log(`  Completed: ${j.id} (${j.name})`);
    console.log(`    processedOn: ${j.processedOn ? new Date(j.processedOn).toISOString() : "?"}`);
    console.log(`    finishedOn: ${j.finishedOn ? new Date(j.finishedOn).toISOString() : "?"}`);
    const duration = j.processedOn && j.finishedOn ? j.finishedOn - j.processedOn : 0;
    console.log(`    duration: ${duration}ms`);
  }

  for (const j of parseFailed) {
    console.log(`  Failed: ${j.id} (${j.name})`);
    console.log(`    reason: ${j.failedReason}`);
    console.log(`    attempts: ${j.attemptsMade}`);
  }

  // Check normalize queue
  const normQueue = new Queue("ingestion-normalize", { connection: { url: REDIS_URL } });
  const normWaiting = await normQueue.getWaiting(0, 5);
  const normCompleted = await normQueue.getCompleted(0, 5);
  const normFailed = await normQueue.getFailed(0, 5);
  const normActive = await normQueue.getActive(0, 5);

  console.log(`\nNormalize queue: waiting=${normWaiting.length}, active=${normActive.length}, completed=${normCompleted.length}, failed=${normFailed.length}`);

  for (const j of normCompleted) {
    console.log(`  Completed: ${j.id} — ${j.data.stateCode} — ${j.data.parsedData?.records?.length || 0} records`);
  }
  for (const j of normWaiting) {
    console.log(`  Waiting: ${j.id} — ${j.data.stateCode} — ${j.data.parsedData?.records?.length || 0} records`);
  }
  for (const j of normFailed) {
    console.log(`  Failed: ${j.id} — ${j.failedReason}`);
  }

  await parseQueue.close();
  await normQueue.close();
}

main().catch(console.error);
