import postgres from "postgres";
import { Queue } from "bullmq";

const dbUrl = process.env.DATABASE_URL || "";
const redisUrl = process.env.REDIS_URL || "";
const sql = postgres(dbUrl);

async function main() {
  // Get WGFD Season Dates source
  const sources = await sql`SELECT id, name, scraper_config FROM data_sources WHERE name = 'WGFD Season Dates & Regulations'`;
  if (sources.length === 0) { console.log("No source found"); return; }
  
  const source = sources[0];
  const cfg = source.scraper_config as any;
  
  // Find the deadlines endpoint
  const deadlineEp = cfg.endpoints.find((ep: any) => ep.path.includes("application-dates-deadlines"));
  if (!deadlineEp) { console.log("No deadline endpoint"); return; }
  
  console.log("Triggering fetch for: " + deadlineEp.path);
  console.log("Parser: " + deadlineEp.parser);
  console.log("Column mappings: " + JSON.stringify(deadlineEp.column_mappings));
  
  const fetchQueue = new Queue("ingestion-fetch", { connection: { url: redisUrl } });
  
  await fetchQueue.add("test-fetch-wgfd-deadlines", {
    sourceId: source.id,
    endpoint: deadlineEp,
    config: cfg,
  }, { priority: 1 });
  
  console.log("Job enqueued. Monitoring queues...");
  
  // Monitor all queues for 90 seconds
  const parseQueue = new Queue("ingestion-parse", { connection: { url: redisUrl } });
  const normalizeQueue = new Queue("ingestion-normalize", { connection: { url: redisUrl } });
  const embedQueue = new Queue("ingestion-embed", { connection: { url: redisUrl } });
  
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const fetchCounts = await fetchQueue.getJobCounts("active", "completed", "failed", "waiting");
    const parseCounts = await parseQueue.getJobCounts("active", "completed", "failed", "waiting");
    const normCounts = await normalizeQueue.getJobCounts("active", "completed", "failed", "waiting");
    const embedCounts = await embedQueue.getJobCounts("active", "completed", "failed", "waiting");
    
    console.log(
      "[" + (i * 5) + "s] fetch=" + JSON.stringify(fetchCounts) +
      " parse=" + JSON.stringify(parseCounts) +
      " norm=" + JSON.stringify(normCounts) +
      " embed=" + JSON.stringify(embedCounts)
    );
    
    // Check if everything is done
    if (fetchCounts.active === 0 && fetchCounts.waiting === 0 &&
        parseCounts.active === 0 && parseCounts.waiting === 0 &&
        normCounts.active === 0 && normCounts.waiting === 0) {
      console.log("All queues drained!");
      break;
    }
  }
  
  // Check DB for results
  const seasons = await sql`SELECT COUNT(*) as cnt FROM seasons`;
  const docs = await sql`SELECT COUNT(*) as cnt FROM documents`;
  console.log("\n=== DB Results ===");
  console.log("seasons: " + seasons[0].cnt);
  console.log("documents: " + docs[0].cnt);
  
  if (parseInt(String(seasons[0].cnt)) > 0) {
    const sample = await sql`SELECT species_id, year, season_name, weapon_type FROM seasons LIMIT 5`;
    console.log("\nSample seasons:");
    for (const s of sample) console.log("  " + JSON.stringify(s));
  }
  
  await fetchQueue.close();
  await parseQueue.close();
  await normalizeQueue.close();
  await embedQueue.close();
  await sql.end();
}

main().catch(console.error);
