import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL || "";

async function main() {
  const parseQueue = new Queue("ingestion-parse", { connection: { url: redisUrl } });
  const normQueue = new Queue("ingestion-normalize", { connection: { url: redisUrl } });

  // Get recent completed parse jobs
  const completed = await parseQueue.getCompleted(0, 5);
  console.log("=== Last 5 Completed Parse Jobs ===");
  for (const job of completed) {
    const data = job.data;
    console.log("  Job " + job.id + ":");
    console.log("    name: " + job.name);
    console.log("    parser: " + data.parser);
    console.log("    docType: " + data.docType);
    console.log("    content size: " + (data.rawContent?.length || 0) + " bytes");
    console.log("    stateCode: " + data.metadata?.stateCode);
    console.log("    columnMappings: " + JSON.stringify(data.metadata?.columnMappings || "none"));
    console.log("    returnValue: " + JSON.stringify(job.returnvalue));
    console.log("    finishedOn: " + (job.finishedOn ? new Date(job.finishedOn).toISOString() : "?"));
    console.log("    processedOn: " + (job.processedOn ? new Date(job.processedOn).toISOString() : "?"));
  }

  // Get recent failed parse jobs
  const failed = await parseQueue.getFailed(0, 5);
  console.log("\n=== Last 5 Failed Parse Jobs ===");
  for (const job of failed) {
    console.log("  Job " + job.id + ": " + job.name);
    console.log("    failedReason: " + job.failedReason);
    console.log("    attemptsMade: " + job.attemptsMade);
    console.log("    parser: " + job.data.parser);
    console.log("    columnMappings: " + JSON.stringify(job.data.metadata?.columnMappings || "none"));
  }

  // Check normalize queue
  const normCompleted = await normQueue.getCompleted(0, 3);
  const normFailed = await normQueue.getFailed(0, 3);
  console.log("\n=== Normalize Queue ===");
  console.log("Completed: " + normCompleted.length);
  for (const j of normCompleted) {
    console.log("  Job " + j.id + ": " + j.name + " state=" + j.data.stateCode + " docType=" + j.data.docType);
    console.log("    records: " + j.data.parsedData?.records?.length);
  }
  console.log("Failed: " + normFailed.length);
  for (const j of normFailed) {
    console.log("  Job " + j.id + ": " + j.failedReason);
  }

  await parseQueue.close();
  await normQueue.close();
}

main().catch(console.error);
