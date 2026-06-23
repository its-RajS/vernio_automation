/**
 * One-time setup: creates the project-assets storage bucket and RLS policies.
 * Run: npx tsx --env-file=.env.local scripts/setup-storage.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Get it from Supabase Dashboard → Project Settings → API → service_role key.
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Step 1: Create bucket if it doesn't exist
  const { data: existing } = await supabase.storage.getBucket("project-assets");

  if (existing) {
    console.log('Bucket "project-assets" already exists.');
  } else {
    const { data, error } = await supabase.storage.createBucket(
      "project-assets",
      { public: false }
    );
    if (error) {
      console.error("Failed to create bucket:", error.message);
      process.exit(1);
    }
    console.log('Bucket "project-assets" created.', data);
  }

  // Step 2: Apply storage RLS policies via raw SQL
  const sql = `
    CREATE POLICY "Users can upload project assets" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY "Users can view own project assets" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY "Users can delete own project assets" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]
      );
  `;

  const { error: sqlError } = await supabase.rpc("exec_sql", {
    sql_text: sql,
  });

  if (sqlError) {
    console.log("\n--- Run this SQL in Supabase Dashboard → SQL Editor ---\n");
    console.log(
      sql
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n\n")
    );
    console.log("\n------------------------------------------------------\n");
  } else {
    console.log("Storage RLS policies applied.");
  }

  console.log("Bucket setup complete.");

}

main();
