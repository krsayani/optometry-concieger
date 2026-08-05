/**
 * Apply supabase/migrations/*.sql to a Supabase project via the Management API
 * or a direct Postgres connection string.
 *
 * Option A — Management API:
 *   SUPABASE_ACCESS_TOKEN=sbp_... \
 *   SUPABASE_PROJECT_REF=pisgcqqejnxukkojzwws \
 *   node scripts/apply-schema.mjs
 *
 * Option B — Database URL (Settings → Database → URI):
 *   DATABASE_URL='postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:6543/postgres' \
 *   node scripts/apply-schema.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const migrationsDir = join(root, "supabase", "migrations");

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => ({
    name: f,
    sql: readFileSync(join(migrationsDir, f), "utf8"),
  }));

if (!migrations.length) {
  console.error("No SQL migrations found in supabase/migrations");
  process.exit(1);
}

async function applyViaManagementApi() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref =
    process.env.SUPABASE_PROJECT_REF ||
    projectRefFromUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

  if (!token || !ref) return false;

  console.log(`Applying ${migrations.length} migration(s) via Management API to ${ref}...`);

  for (const migration of migrations) {
    console.log(`→ ${migration.name}`);
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${ref}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: migration.sql }),
      },
    );
    const text = await response.text();
    if (!response.ok) {
      console.error(`Failed on ${migration.name}:`, response.status, text);
      process.exit(1);
    }
    console.log(`  ok (${response.status})`);
  }

  return true;
}

async function applyViaPostgres() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) return false;

  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error(
      "Install pg to use DATABASE_URL: npm install pg\nOr use SUPABASE_ACCESS_TOKEN instead.",
    );
    process.exit(1);
  }

  const client = new pg.default.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Applying ${migrations.length} migration(s) via Postgres...`);
  await client.connect();
  try {
    for (const migration of migrations) {
      console.log(`→ ${migration.name}`);
      await client.query(migration.sql);
      console.log("  ok");
    }
  } finally {
    await client.end();
  }
  return true;
}

const applied =
  (await applyViaManagementApi()) || (await applyViaPostgres());

if (!applied) {
  console.error(`Missing credentials.

Provide ONE of:
  1) SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF (or VITE_SUPABASE_URL)
  2) DATABASE_URL (Postgres connection string from Supabase → Settings → Database)

Then re-run:
  node scripts/apply-schema.mjs
`);
  process.exit(1);
}

console.log("Schema applied successfully.");
