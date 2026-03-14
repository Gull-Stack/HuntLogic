import { Queue } from "bullmq";
import { getParser } from "../src/services/ingestion/parsers";

const redisUrl = process.env.REDIS_URL || "";

async function main() {
  const parseQueue = new Queue("ingestion-parse", { connection: { url: redisUrl } });
  
  // Get the latest completed parse job
  const completed = await parseQueue.getCompleted(0, 1);
  const job = completed[0];
  
  if (!job) {
    console.log("No completed parse jobs");
    await parseQueue.close();
    return;
  }
  
  console.log("Job " + job.id + " (" + job.name + ")");
  console.log("rawContent length: " + job.data.rawContent.length);
  console.log("rawContent starts with: " + job.data.rawContent.substring(0, 100));
  console.log("parser: " + job.data.parser);
  console.log("columnMappings: " + JSON.stringify(job.data.metadata?.columnMappings));
  
  // Try parsing the content manually
  console.log("\n=== Manual parse test ===");
  const parser = getParser(job.data.parser);
  const result = await parser.parse(job.data.rawContent, {
    state_code: job.data.metadata.stateCode,
    year: job.data.metadata.year,
    column_mappings: job.data.metadata.columnMappings,
  });
  
  console.log("Records: " + result.records.length);
  console.log("Quality: " + result.qualityScore);
  
  await parseQueue.close();
}

main().catch(console.error);
