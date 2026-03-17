import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './src/lib/db/schema/index.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  await db.update(users).set({ onboardingComplete: false, onboardingStep: 'welcome' }).where(eq(users.email, 'josh@seaena.com'));
  console.log('Set josh@seaena.com to onboardingComplete: false');
  await sql.end();
}
main();
