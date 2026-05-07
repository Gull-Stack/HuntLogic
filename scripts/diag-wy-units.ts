/**
 * Diagnose why WY draw_odds have hunt_unit_id=null while NV is fully linked.
 * Run: DATABASE_URL="..." npx tsx scripts/diag-wy-units.ts
 */
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL || "");

  console.log("WY draw_odds sample (10 rows):");
  const wy = await sql`
    SELECT d.year, sp.slug AS species,
           d.hunt_unit_id,
           d.raw_data->>'unit' AS raw_unit,
           d.raw_data->>'unitCode' AS raw_unit_code,
           d.raw_data->>'unit_code' AS raw_unit_code_snake
    FROM draw_odds d
    JOIN states s ON s.id = d.state_id
    LEFT JOIN species sp ON sp.id = d.species_id
    WHERE s.code = 'WY'
    LIMIT 10
  `;
  console.log(wy);

  console.log("\nWY hunt_units total:");
  const wyUnits = await sql`
    SELECT count(*)::int AS units
    FROM hunt_units h
    JOIN states s ON s.id = h.state_id
    WHERE s.code = 'WY'
  `;
  console.log(wyUnits[0]);

  console.log("\nSample WY hunt_units (5):");
  const sample = await sql`
    SELECT unit_code, unit_name
    FROM hunt_units h
    JOIN states s ON s.id = h.state_id
    WHERE s.code = 'WY'
    LIMIT 5
  `;
  console.log(sample);

  console.log("\nDistinct raw_data->>'unit' values in WY draw_odds (first 20):");
  const distinct = await sql`
    SELECT DISTINCT raw_data->>'unit' AS raw_unit, raw_data->>'unitCode' AS raw_unit_code
    FROM draw_odds d
    JOIN states s ON s.id = d.state_id
    WHERE s.code = 'WY'
    LIMIT 20
  `;
  console.log(distinct);

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
