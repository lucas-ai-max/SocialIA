import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString:
    "postgresql://postgres.wdsntvemidqoqrautunn:Futebolarte%231@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database.");

    // Check if column already exists
    const check = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_photo_url'
    `);

    if (check.rows.length > 0) {
      console.log("Column profile_photo_url already exists. Skipping.");
    } else {
      await client.query(
        "ALTER TABLE public.profiles ADD COLUMN profile_photo_url TEXT"
      );
      console.log("Column profile_photo_url added successfully.");
    }
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
