import { PDFParse } from "pdf-parse";

async function main() {
  // Test with WGFD 2025 Elk Nonresident Random draw odds
  const url = "https://wgfd.wyo.gov/media/32449/download?inline";
  console.log("Fetching PDF:", url);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 HuntLogic/1.0" },
    redirect: "follow",
  });

  if (!res.ok) {
    console.error("HTTP", res.status, res.statusText);
    return;
  }

  const buffer = await res.arrayBuffer();
  console.log(`Downloaded ${buffer.byteLength} bytes\n`);

  const parser = new PDFParse({ data: Buffer.from(buffer) });

  // Test getText
  console.log("=== getText() ===");
  const textResult = await parser.getText();
  console.log(`Pages: ${textResult.total}`);
  console.log(`Text length: ${textResult.text.length} chars`);
  console.log("\nFirst 2000 chars:");
  console.log(textResult.text.slice(0, 2000));

  // Test getTable
  console.log("\n\n=== getTable() ===");
  try {
    const tableResult = await parser.getTable();
    console.log(`Table pages: ${tableResult.pages.length}`);
    for (const page of tableResult.pages) {
      console.log(`\nPage ${page.num}: ${page.tables.length} tables`);
      for (let t = 0; t < page.tables.length; t++) {
        const table = page.tables[t];
        console.log(`  Table ${t}: ${table.length} rows`);
        // Show first 5 rows
        for (let r = 0; r < Math.min(5, table.length); r++) {
          console.log(`    Row ${r}: ${JSON.stringify(table[r])}`);
        }
        if (table.length > 5) {
          console.log(`    ... (${table.length - 5} more rows)`);
        }
      }
    }
  } catch (err) {
    console.error("getTable() failed:", err);
  }
}

main().catch(console.error);
